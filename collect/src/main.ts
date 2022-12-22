import Bluebird from 'bluebird';
import { loadTasks } from "./tasks";
import _ from 'lodash';
import { Dayjs } from './utils/datetime';
import { logger } from './utils/logger';
import { loadDB, closeAllDB } from './db';
import { DBNAME } from './config';
import { AppContext } from './types/context.d';
import { timeout } from "./utils/promise-utils";
import { monitorLensContract } from "./tasks/monitor";
import { createChildLoggerWith } from "./utils/logger";

const MaxTickTimout = 15 * 1000;
const MaxNoNewBlockDuration = Dayjs.duration({
  minutes: 30,
});

async function main() {
  const db = await loadDB(DBNAME);
  if (db === null)
    process.exit(1);

  const context: AppContext = {
    database: db,
    logger: logger,
  }

  try {
    //_.forEach(tasks, (t: any) => t.start());
    const tasks = await loadTasks(context);
    //monitorLensContract({
    //  database:context.database,
    //  logger:createChildLoggerWith({moduleId:'monitor'},context.logger)
    //});
    await doEventLoop();
  } catch(e) {
    logger.error(`unexpected error occurs, message:${e}`);
    throw e;
  } finally {
    await timeout(closeAllDB(), 5 * 1000, null);
    logger.info('stopping tasks');
    //await timeout(
    //  Bluebird.map(tasks, (t: any) => t.stop()),
    //  5 * 1000,
    //  [],
    //);
  }
}

async function doEventLoop(): Promise<void> {
  logger.info('running event loop');
  do {
    await Bluebird.delay(10 * 1000);
  } while (true); // eslint-disable-line
}

main()
  .catch((e: any) => {
    logger.error(e.message);
    process.exit(1);
  })
