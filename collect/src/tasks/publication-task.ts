import Bluebird from 'bluebird';
import { PublicationTypes } from '../graphql/generated';
import { queryPublications } from '../operation/get-publications';
import { makeIntervalTask } from './task-utils';
import { randomRange } from '../utils';
import { Task } from '../types/tasks.d';
import { AppContext } from '../types/context.d';
import { createDBOperator } from '../db/operator';
import { SimpleTask } from '../types/tasks.d';
import { Logger } from 'winston';
import { IsStopped } from './task-utils';
import { getTimestamp } from '../utils';
import { 
  LENS_DATA_LIMIT,
  MAX_TASK,
} from '../config';
import os from 'os';

//const maxTaskNum = os.cpus().length;

export async function getPublication(
  context: AppContext, 
  id: string,
): Promise<void> {
  const logger = context.logger;
  const dbOperator = createDBOperator(context.database);
  let cursor = await dbOperator.getPublicationCursor(id);
  let tryout = 3;
  while (true) {
    try {
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
      const { items } = res.publications;
      await dbOperator.insertPublications(items);
      // Update publication cursor for unexpected crash
      if (res.publications.pageInfo.next !== null) {
        cursor = res.publications.pageInfo.next;
      }
      await dbOperator.updatePublicationCursor(id, cursor);
      if (items.length < LENS_DATA_LIMIT) {
        break;
      }
    } catch (e: any) {
      logger.error(`Get publication(profileId:${id}) failed, error:${e}`);
      if (e.networkError && e.networkError.statusCode === 429) {
        await Bluebird.delay(5 * 60 * 1000);
      }
      if (--tryout === 0) {
        break;
      }
    }
  }
  await dbOperator.updateProfileCursorAndTimestamp(id, cursor, context.timestamp);
  //logger.info(`id:${id},cursor:${cursor} done.`);
}

export async function handlePublications(
  context: AppContext,
  logger: Logger,
  isStopped: IsStopped,
): Promise<void> {
  const dbOperator = createDBOperator(context.database);
  context.timestamp = await dbOperator.getOrSetLastUpdateTimestamp();
  context.logger = logger;
  try {
    const ids = await dbOperator.getProfileIdsWithLimit();
    if (ids.length === 0) {
      logger.info('set timestamp');
      await dbOperator.setLastUpdateTimestamp(getTimestamp());
    }
    await Bluebird.map(ids, async (id: any) => {
      if (!isStopped()) {
        await getPublication(context, id)
      }
    }, { concurrency : MAX_TASK })
  } catch (e: any) {
    logger.error(`handle publication failed, error:${e}`);
  }
}

export async function createPublicationTask(
  context: AppContext,
  loggerParent: Logger,
): Promise<SimpleTask> {
  const interval = 3 * 1000;
  return makeIntervalTask(
    0,
    interval,
    'get-publications',
    context,
    loggerParent,
    handlePublications,
    '💎',
  );
}
