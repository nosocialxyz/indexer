import Bluebird from 'bluebird';
import { apolloClient } from '../apollo-client';
import { PublicationTypes } from '../graphql/generated';
import { queryPublications } from '../operation/get-publications';
import { makeIntervalTask } from './task-utils';
import { logger } from '../utils/logger';
import { randomRange } from '../utils';
import { Task } from '../types/tasks.d';
import { getDbOperatorByName } from '../db/operator';
import Lock from '../utils/lock';
import os from 'os';

//const maxTaskNum = os.cpus().length / 2;
const maxTaskNum = 4;
const sharedBuffer = new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT);
const sharedArray = new Int32Array(sharedBuffer);
const lock = new Lock(sharedArray, 0);

async function getPublication(id: string) {
  try {
    const collName = 'publication';
    const rowNum = 50;
    const dbOperator = await getDbOperatorByName('test');
    let cursor = await dbOperator.getPublicationCursor(id);
    //let cursor = '{}';
    while (true) {
      const res = await queryPublications({
        profileId: id,
        publicationTypes: [ 
          PublicationTypes.Post, 
          PublicationTypes.Comment, 
          PublicationTypes.Mirror,
        ],
        cursor: cursor,
        limit: rowNum,
      })
      if (res === null || res.publications.items.length === 0)
        break;

      //logger.info(res.publications.pageInfo)
      //logger.info(res.publications.items)
      /*
      let prev = res.publications.pageInfo.prev;
      let next = res.publications.pageInfo.next;
      prev = prev.substr(0, prev.length - 9);
      next = next.substr(0, next.length - 8);
      logger.info(prev)
      logger.info(next)
      if (prev === next)
        break
      */

      const items = res.publications.items;
      await dbOperator.insertMany(collName, items);
      if (items.length < rowNum)
        break

      // Update cursor for unexpected crash
      cursor = res.publications.pageInfo.next;
      await dbOperator.updatePublicationCursor(id, cursor);

      //logger.info(`id:${id} get publications num:${items.length}`);
      const sec = randomRange(1, 5);
      await Bluebird.delay(sec * 1000);
    }
    logger.info(`id:${id} done.`);
    // Set publication cursor to null
    await dbOperator.deleteCursor({_id:id});
  } catch (e: any) {
    logger.error(e);
  }
}

export async function getPublications() {
  if (!lock.tryLock()) {
    logger.info('try to get publications lock failed.');
    return;
  }
  try {
    const collName = 'publication';
    const dbOperator = await getDbOperatorByName('test');
    let ids = await dbOperator.getNotNullPubCursor();
    logger.info(ids)
    if (ids.length === 0) {
      ids = await dbOperator.getProfileIds();
    }
    await Bluebird.map(ids, (id: any) => getPublication(id), { concurrency : maxTaskNum })
    logger.info('Get publications done.');
  } catch (e: any) {
    logger.error(e);
  } finally {
    logger.info('Get publications done.');
    lock.unlock();
  }
}

export async function createPublicationTask(): Promise<Task> {
  const interval = 3 * 60 * 1000;
  return makeIntervalTask(
    interval,
    interval,
    'get-publications',
    getPublications,
  );
}
