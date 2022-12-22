import Bluebird from 'bluebird';
import { exploreProfiles } from '../operation/get-profiles';
import { ProfileSortCriteria } from '../graphql/generated';
import { createDBOperator } from '../db/operator';
import { makeIntervalTask } from './task-utils';
import { Task } from '../types/tasks.d';
import { AppContext } from '../types/context.d';
import { logger } from '../utils/logger';
import { LENS_DATA_LIMIT } from '../config';
import Lock from '../utils/lock';

const sharedBuffer = new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT);
const sharedArray = new Int32Array(sharedBuffer);
const lock = new Lock(sharedArray, 0);

export async function createProfileTask(context: AppContext) {
  const logger = context.logger;
  logger.info('Start get profiles.');
  const dbOperator = await createDBOperator(context.database);
  let cursor = await dbOperator.getProfileCursor();
  while (true) {
    try {
      // Sleep for rate limit
      await Bluebird.delay(1 * 1000);
      const res = await exploreProfiles({
        sortCriteria: ProfileSortCriteria.MostFollowers,
        cursor: cursor,
        limit: LENS_DATA_LIMIT,
      })

      if (res.items.length > 0)
        await dbOperator.insertProfiles(res.items);

      // Update cursor for unexpected crash
      cursor = res.pageInfo.next;
      await dbOperator.updateProfileCursor(cursor);
      if (res.items.length < LENS_DATA_LIMIT) {
        await dbOperator.updateProfileCursor(cursor, 'complete');
        break;
      }
    } catch(e: any) {
      logger.error(`Get profile error, error:${e}`);
      if (e.networkError.statusCode === 429)
        await Bluebird.delay(5 * 60 * 1000);
    }
  }
  logger.info('Profiles sync is complete.');
}
