import Bluebird from 'bluebird';
import { exploreProfiles } from '../operation/get-profiles';
import { ProfileSortCriteria } from '../graphql/generated';
import { createDBOperator } from '../db/operator';
import { makeIntervalTask } from './task-utils';
import { Task } from '../types/tasks.d';
import { AppContext } from '../types/context.d';
import { logger } from '../utils/logger';
import { LENS_DATA_LIMIT, PROFILE_COLL } from '../config';
import Lock from '../utils/lock';

const sharedBuffer = new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT);
const sharedArray = new Int32Array(sharedBuffer);
const lock = new Lock(sharedArray, 0);

export async function getProfiles(context: AppContext) {
  if (!lock.tryLock()) {
    logger.info('try to get profiles lock failed.');
    return;
  }
  try {
    const dbOperator = await createDBOperator(context.database);
    let cursor = await dbOperator.getProfileCursor();
    while (true) {
      const res = await exploreProfiles({
        sortCriteria: ProfileSortCriteria.MostFollowers,
        cursor: cursor,
        limit: LENS_DATA_LIMIT,
      })
      cursor = res.pageInfo.next;
      if (res.items.length === 0) {
        await dbOperator.updateProfileCursor('{}');
        break;
      }
      await dbOperator.insertMany(PROFILE_COLL, res.items);
      // Update cursor for unexpected crash
      await dbOperator.updateProfileCursor(cursor);

      await Bluebird.delay(1 * 1000);
    }
  } catch(e: any) {
    logger.error(e);
  } finally {
    lock.unlock();
  }
}

export async function createProfileTask(context: AppContext): Promise<Task> {
  const interval = 15 * 60 * 1000;
  return makeIntervalTask(
    interval,
    interval,
    'get-profiles',
    context,
    getProfiles,
  );
}
