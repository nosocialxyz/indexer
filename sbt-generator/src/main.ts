import Bluebird from "bluebird";
import _ from "lodash";
import { logger } from "./utils/logger";
import { AppContext } from "./types/context.d";
import { SimpleTask } from "./types/tasks.d";
import { timeout } from "./utils/promise-utils";
import { getTimestamp } from "./utils";
import { createSimpleTasks } from "./tasks";

const MaxTickTimout = 15 * 1000;

async function main() {
  const context: AppContext = {
    logger: logger,
    timestamp: getTimestamp(),
  };

  const simpleTasks = await loadSimpleTasks(context);

  try {
    // start tasks
    _.forEach(simpleTasks, (t) => t.start(context));
    // start event loop
    await doEventLoop(context);
  } catch (e) {
    logger.error(`unexpected error occurs, message:${e}`);
    throw e;
  } finally {
    logger.info("stopping simple tasks");
    await timeout(
      Bluebird.map(simpleTasks, (t) => t.stop()),
      5 * 1000,
      []
    );
  }
}

async function loadSimpleTasks(context: AppContext): Promise<SimpleTask[]> {
  const tasks = await createSimpleTasks(context);
  return tasks;
}

async function doEventLoop(context: AppContext): Promise<void> {
  logger.info("running event loop");
  do {
    await Bluebird.delay(10 * 1000);
  } while (true); // eslint-disable-line
}

main().catch((e: any) => {
  logger.error(e.message);
  process.exit(1);
});
