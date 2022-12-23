import Bluebird from 'bluebird';
import { PublicationTypes } from '../graphql/generated';
import { queryPublications } from '../operation/get-publications';
import { makeIntervalTask } from './task-utils';
import { randomRange } from '../utils';
import { Task } from '../types/tasks.d';
import { AppContext } from '../types/context.d';
import { createDBOperator } from '../db/operator';
import { LENS_DATA_LIMIT } from '../config';
import Lock from '../utils/lock';
import os from 'os';

const maxTaskNum = os.cpus().length / 2;
//const maxTaskNum = 4;
const sharedBuffer = new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT);
const sharedArray = new Int32Array(sharedBuffer);
const lock = new Lock(sharedArray, 0);

async function getPublication(context: AppContext, id: string) {
  const logger = context.logger;
  const dbOperator = await createDBOperator(context.database);
  let cursor = await dbOperator.getPublicationCursor(id);
  while (true) {
    try {
      // check if stop
      if (await dbOperator.getStop())
        break;

      await Bluebird.delay(randomRange(1, 5) * 1000);
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

      const items = res.publications.items;
      if (items.length > 0)
        await dbOperator.insertPublications(items);

      if (items.length < LENS_DATA_LIMIT) {
        await dbOperator.updatePublicationCursor(id, '{}');
        break;
      }
      // Update publication cursor for unexpected crash
      cursor = res.publications.pageInfo.next;
      await dbOperator.updatePublicationCursor(id, cursor);
    } catch (e: any) {
      logger.error(`Get publication(profileId:${id}) error,info:${e}`);
      if (e.statusCode === 404) {
        await dbOperator.updatePublicationCursor(id, '{}');
        break;
      }
      if (e.networkError.statusCode === 429)
        await Bluebird.delay(5 * 60 * 1000);
    }
  }
  //logger.info(`id:${id},cursor:${cursor} done.`);
}

export async function createPublicationTask(context: AppContext) {
  const logger = context.logger;
  logger.info('start get publications');
  const dbOperator = await createDBOperator(context.database);
  await dbOperator.incTask();
  while (true) {
    try {
      const isFinished = await dbOperator.isUpdateFinished();
      const ids = await dbOperator.getProfileIds();
      let idArray: string[] = [];
      while (await ids.hasNext()) {
        idArray.push((await ids.next())._id);
        if (idArray.length >= LENS_DATA_LIMIT) {
          await Bluebird.map(idArray, (id: any) => getPublication(context, id), { concurrency : maxTaskNum })
          idArray = [];
        }
        // check if stop
        if (await dbOperator.getStop()) {
          logger.info('Stop publication task.');
          await dbOperator.decTask();
          return;
        }
      }
      if (idArray.length > 0) {
        await Bluebird.map(idArray, (id: any) => getPublication(context, id), { concurrency : maxTaskNum })
      }
      if (isFinished) {
        logger.info('Update publications complete.');
        break;
      }

      await Bluebird.delay(3 * 1000);
    } catch (e: any) {
      logger.error(e);
    }
  }
  await dbOperator.decTask();
}

export async function updatePublications(context: AppContext) {
  const logger = context.logger;
  logger.info('Update publications');
  const dbOperator = await createDBOperator(context.database);
  try {
    const ids = await dbOperator.getProfileIds();
    let idArray: string[] = [];
    while (await ids.hasNext()) {
      idArray.push((await ids.next())._id);
      if (idArray.length >= LENS_DATA_LIMIT) {
        await Bluebird.map(idArray, (id: any) => getPublication(context, id), { concurrency : maxTaskNum })
        idArray = [];
      }
      // check if stop
      if (await dbOperator.getStop()) {
        logger.info('Stop update publication task.');
        return;
      }
    }
    if (idArray.length > 0) {
      await Bluebird.map(idArray, (id: any) => getPublication(context, id), { concurrency : maxTaskNum })
    }
  } catch (e: any) {
    logger.error(`Update publications failed, error:${e}`);
  }
  logger.info('Update publications complete.');
}
