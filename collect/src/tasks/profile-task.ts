import Bluebird from 'bluebird';
import { exploreProfiles } from '../operation/get-profiles';
import { ProfileSortCriteria } from '../graphql/generated';
import { createDBOperator } from '../db/operator';
import { makeIntervalTask } from './task-utils';
import { Task } from '../types/tasks.d';
import { AppContext } from '../types/context.d';
import { Logger } from 'winston';
import { SimpleTask } from '../types/tasks.d';
import { IsStopped } from './task-utils';
import { LENS_DATA_LIMIT } from '../config';

async function handleProfiles(
  context: AppContext,
  logger: Logger,
  _isStopped: IsStopped,
): Promise<void> {
  try {
    const dbOperator = createDBOperator(context.database);
    let cursor = await dbOperator.getProfileCursor();
    const res = await exploreProfiles({
      sortCriteria: ProfileSortCriteria.CreatedOn,
      cursor: cursor,
      limit: LENS_DATA_LIMIT,
    })
    await dbOperator.insertProfiles(res.items);
    // Update cursor for unexpected crash
    cursor = res.pageInfo.next;
    if (cursor !== null) {
      await dbOperator.updateProfileCursor(cursor);
    }
    //if (res.items.length < LENS_DATA_LIMIT) {
    //  //await dbOperator.updateProfileCursor(cursor, 'complete');
    //  logger.info(`No more profiles.`);
    //}
  } catch(e: any) {
    logger.error(`Get profile error, error:${e}`);
    if (e.networkError && e.networkError.statusCode === 429)
      await Bluebird.delay(5 * 60 * 1000);
  }
}

export async function createProfileTask(
  context: AppContext,
  loggerParent: Logger,
): Promise<SimpleTask> {
  const interval = 5 * 1000;
  return makeIntervalTask(
    0,
    interval,
    'explore-profiles',
    context,
    loggerParent,
    handleProfiles,
    '🧑',
  );
}
