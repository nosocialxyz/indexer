import Bluebird from 'bluebird';
import { AppContext } from "../types/context.d";
import { createAPI } from "./api-task";
import { createDBOperator } from '../db/operator';
import { createProfileTask } from "./profile-task";
import { createPublicationTask } from "./publication-task";
import { createChildLoggerWith } from "../utils/logger";

export async function loadTasks(context: AppContext) {
  const db = context.database;
  const dbOperator = await createDBOperator(db);
  const syncedBlock = await dbOperator.getSyncedBlockNumber();
  if (syncedBlock > 0)
    return;

  await dbOperator.setStartBlockNumber();
  let tasks = [
    {
      name: 'api',
      task: createAPI,
    },
    {
      name: 'explore:profiles',
      task: createProfileTask,
    },
    {
      name: 'get:publications',
      task: createPublicationTask,
    },
  ];
  await Bluebird.map(tasks, async (task: any) => {
    context.logger = createChildLoggerWith({
      moduleId: task.name,
    },context.logger);
    await task.task(context);
  });
}
