import Bluebird from 'bluebird';
import { exploreProfiles } from '../operation/get-profiles';
import { ProfileSortCriteria } from '../graphql/generated';
import { getDbOperatorByName } from '../db/operator';
import { makeIntervalTask } from './task-utils';
import { Task } from '../types/tasks.d';
import { logger } from '../utils/logger';
import Lock from '../utils/lock';

const sharedBuffer = new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT);
const sharedArray = new Int32Array(sharedBuffer);
const lock = new Lock(sharedArray, 0);

export async function getProfiles() {
  if (!lock.tryLock()) {
    logger.info('try to get profiles lock failed.');
    return;
  }
  try {
    const dbOperator = await getDbOperatorByName('test');
    const collName = "profile";
    const rowStep = 50;
    let cursor = await dbOperator.getProfileCursor();
    while (true) {
      const res = await exploreProfiles({
        sortCriteria: ProfileSortCriteria.MostFollowers,
        cursor: cursor,
        limit: rowStep
      })
      cursor = res.pageInfo.next;
      //logger.info(res.items.length)
      if (res.items.length === 0) {
        await dbOperator.updateProfileCursor('{}');
        break;
      }
      await dbOperator.insertMany(collName, res.items);
      // Update cursor for unexpected crash
      await dbOperator.updateProfileCursor(cursor);

      await Bluebird.delay(1 * 1000);
    }
  } catch(e: any) {
    logger.error(e);
    return;
  } finally {
    lock.unlock();
  }
}

export async function createProfileTask(): Promise<Task> {
  const interval = 15 * 60 * 1000;
  return makeIntervalTask(
    interval,
    interval,
    'get-profiles',
    getProfiles,
  );
}
