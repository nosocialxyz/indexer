import Bluebird from 'bluebird';
import { AppContext } from '../types/context.d';
import { getProfilesByAddresses } from '../operation';
import { createDBOperator } from '../db/operator';
import { makeIntervalTask } from './task-utils';
import { getPublication } from './publication-task';
import { SimpleTask } from '../types/tasks.d';
import { IsStopped } from './task-utils';
import { Logger } from 'winston';
import { MAX_TASK } from '../config';
import { getTimestamp } from '../utils';

export async function handleWhitelist(
  context: AppContext,
  logger: Logger,
  isStopped: IsStopped,
): Promise<void> {
  try {
    const dbOperator = createDBOperator(context.database);
    const addresses = await dbOperator.getWhiteList();
    context.timestamp = getTimestamp();
    const profiles = await getProfilesByAddresses(addresses);
    await dbOperator.insertProfiles(profiles);
    await Bluebird.map(profiles, async ({_id}) => {
      if (!isStopped()) {
        await getPublication(context, _id);
      }
    }, { concurrency: MAX_TASK/2 });
  } catch (e: any) {
    logger.error(`Update white list failed, error:${e}`);
  }
}

export async function createWhitelistTask(
  context: AppContext,
  loggerParent: Logger,
): Promise<SimpleTask> {
  const interval = 3 * 1000;
  return makeIntervalTask(
    0,
    interval,
    'update-whitelist',
    context,
    loggerParent,
    handleWhitelist,
    '🎉',
  );
}
