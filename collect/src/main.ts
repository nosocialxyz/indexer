import Bluebird from 'bluebird';
import _ from 'lodash';
import { Dayjs } from './utils/datetime';
import { logger } from './utils/logger';
import { loadDB, closeAllDB } from './db';
import { createDBOperator } from './db/operator';
import { DB_NAME } from './config';
import { AppContext } from './types/context.d';
import { SimpleTask } from './types/tasks.d';
import { timeout } from "./utils/promise-utils";
import { getTimestamp } from "./utils";
import { createChildLoggerWith } from "./utils/logger";
import { createSimpleTasks } from "./tasks";
import { startAPI } from "./tasks/api-task";

const MaxTickTimout = 15 * 1000;

async function main() {
  const db = await loadDB(DB_NAME);
  if (db === null)
    process.exit(1);

  const context: AppContext = {
    database: db,
    logger: logger,
    timestamp: getTimestamp(),
  }

  const dbOperator = createDBOperator(db);
  await dbOperator.deleteStop();

  const simpleTasks = await loadSimpleTasks(context);

  try {
    // start tasks
    _.forEach(simpleTasks, (t) => t.start(context));
    // start api service
    startAPI(context);
    // start event loop
    await doEventLoop(context);
  } catch(e) {
    logger.error(`unexpected error occurs, message:${e}`);
    throw e;
  } finally {
    logger.info('stopping simple tasks');
    await timeout(
      Bluebird.map(simpleTasks, (t) => t.stop()),
      5 * 1000,
      [],
    );
    await timeout(closeAllDB(), 5 * 1000, null);
    //await timeout(
    //  Bluebird.map(tasks, (t: any) => t.stop()),
    //  5 * 1000,
    //  [],
    //);
  }
}

async function loadSimpleTasks(context: AppContext): Promise<SimpleTask[]> {
  const tasks = await createSimpleTasks(context);
  return tasks;
}

async function doEventLoop(context: AppContext): Promise<void> {
  logger.info('running event loop');
  const dbOperator = createDBOperator(context.database);
  do {
    const stop = await dbOperator.getStop();
    if (stop) {
      await dbOperator.deleteStop();
      break;
    }
    await Bluebird.delay(10 * 1000);
  } while (true); // eslint-disable-line
}

main()
  .catch((e: any) => {
    logger.error(e.message);
    process.exit(1);
  })
