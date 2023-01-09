import Bluebird from 'bluebird';
import { AppContext } from "../types/context.d";
import { SimpleTask } from '../types/tasks.d';
import { createChildLogger } from '../utils/logger';
import { createDBOperator } from '../db/operator';
import { createProfileTask } from "./profile-task";
import { createPublicationTask } from "./publication-task";
import { createWhitelistTask } from "./whitelist-task";
import { createMonitorTask } from "./monitor";
import { createChildLoggerWith } from "../utils/logger";

export async function createSimpleTasks(
  context: AppContext
): Promise<SimpleTask[]> {
  const db = context.database;
  const dbOperator = createDBOperator(db);
  await dbOperator.setStartBlockNumber();

  const logger = createChildLogger({ moduleId: 'simple-tasks' });
  let tasks = [
    createProfileTask,
    createPublicationTask,
    createWhitelistTask,
    createMonitorTask,
  ];
  return Bluebird.mapSeries(tasks, (t) => {
    return t(context, logger);
  });
  /*
  await Bluebird.map(tasks, async (task: any) => {
    context.logger = createChildLoggerWith({
      moduleId: task.name,
    },context.logger);
    //await task.task(context);
    task.task(context);
  });
  */
}
