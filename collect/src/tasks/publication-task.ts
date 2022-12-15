import Bluebird from 'bluebird';
import { PublicationTypes } from '../graphql/generated';
import { queryPublications } from '../operation/get-publications';
import { makeIntervalTask } from './task-utils';
import { logger } from '../utils/logger';
import { randomRange } from '../utils';
import { Task } from '../types/tasks.d';
import { AppContext } from '../types/context.d';
import { createDBOperator } from '../db/operator';
import { LENS_DATA_LIMIT, PUBLICATION_COLL } from '../config';
import Lock from '../utils/lock';
import os from 'os';

//const maxTaskNum = os.cpus().length / 2;
const maxTaskNum = 4;
const sharedBuffer = new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT);
const sharedArray = new Int32Array(sharedBuffer);
const lock = new Lock(sharedArray, 0);
let lastUpdateTimeStamp = 0;

async function getPublication(context: AppContext, id: string) {
  try {
    const dbOperator = await createDBOperator(context.database);
    let cursor = await dbOperator.getPublicationCursor(id);
    while (true) {
      const sec = randomRange(1, 5);
      await Bluebird.delay(sec * 1000);
      const res = await queryPublications({
        profileId: id,
        publicationTypes: [ 
          PublicationTypes.Post, 
          PublicationTypes.Comment, 
          PublicationTypes.Mirror,
        ],
        cursor: cursor,
        limit: LENS_DATA_LIMIT,
      })
      if (res === null || res.publications.items.length === 0)
        break;

      const items = res.publications.items;
      await dbOperator.insertMany(PUBLICATION_COLL, items);
      if (items.length < LENS_DATA_LIMIT)
        break

      // Update publication cursor for unexpected crash
      cursor = res.publications.pageInfo.next;
      await dbOperator.updatePublicationCursor(id, cursor);

      //logger.info(`id:${id} get publications num:${items.length}`);
    }
    logger.info(`id:${id},cursor:${cursor},lastUpdateTimeStamp:${lastUpdateTimeStamp} done.`);
    await dbOperator.updateProfileCursorAndTime(id, cursor, lastUpdateTimeStamp);
  } catch (e: any) {
    logger.error(e);
  }
}

export async function getPublications(context: AppContext) {
  if (!lock.tryLock()) {
    logger.info('try to get publications lock failed.');
    return;
  }
  try {
    lastUpdateTimeStamp = Date.now();
    const dbOperator = await createDBOperator(context.database);
    const ids = await dbOperator.getProfileIds();
    let idArray: string[] = [];
    while (await ids.hasNext()) {
      idArray.push((await ids.next())._id);
      //logger.info(idArray[0]);
      if (idArray.length >= 10000) {
        logger.info(`profile num:${idArray.length}`)
        await Bluebird.map(idArray, (id: any) => getPublication(context, id), { concurrency : maxTaskNum })
        idArray = [];
      }
    }
    if (idArray.length > 0) {
      logger.info(`profile num:${idArray.length}`)
      await Bluebird.map(idArray, (id: any) => getPublication(context, id), { concurrency : maxTaskNum })
    }

    await dbOperator.updateLastUpdateTimeStamp(lastUpdateTimeStamp);
  } catch (e: any) {
    logger.error(e);
  } finally {
    logger.info('Get publications done.');
    lock.unlock();
  }
}

export async function createPublicationTask(context: AppContext): Promise<Task> {
  const interval = 3 * 60 * 1000;
  return makeIntervalTask(
    interval,
    interval,
    'get-publications',
    context,
    getPublications,
  );
}
