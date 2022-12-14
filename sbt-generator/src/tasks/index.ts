import Bluebird from "bluebird";
import { AppContext } from "../types/context.d";
import { SimpleTask } from "../types/tasks.d";
import { createChildLogger } from "../utils/logger";
import { createNFTTask } from "./mint-task";
import { createTokenIdTask } from "./update-token-id";

export async function createSimpleTasks(
  context: AppContext
): Promise<SimpleTask[]> {
  const logger = createChildLogger({ moduleId: "simple-tasks" });
  let tasks = [createNFTTask, createTokenIdTask];
  return Bluebird.mapSeries(tasks, (t) => {
    return t(context, logger);
  });
}
