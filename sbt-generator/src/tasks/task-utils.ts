import { Function0, Function3 } from "lodash";
import { Task } from "../types/tasks";
import { formatError } from "../utils";
import { Logger } from "winston";
import { AppContext } from "../types/context.d";
import { createChildLoggerWith } from "../utils/logger";

export type IsStopped = Function0<boolean>;

export async function makeIntervalTask(
  startDelay: number,
  interval: number, // in millseconds
  name: string,
  context: AppContext,
  loggerParent: Logger,
  handlerFn: Function3<AppContext, Logger, IsStopped, Promise<void>>,
  prefix?: string
): Promise<Task> {
  if (startDelay < 0 || interval < 0) {
    throw new Error("invalid arg, interval should not be less than 0");
  }
  if (prefix === null || prefix === undefined) {
    prefix = " ";
  }
  const logger = createChildLoggerWith(
    { moduleId: name, modulePrefix: prefix },
    loggerParent
  );
  let timer: NodeJS.Timeout;
  let stopped = false;

  const doInterval = async () => {
    if (stopped) {
      return;
    }
    try {
      await handlerFn(context, logger, () => stopped);
    } catch (e) {
      logger.error(
        'unexpected execption running task "%s", %s',
        name,
        formatError(e)
      );
    } finally {
      //logger.info('task done: "%s"', name);
      if (!stopped) {
        timer = setTimeout(doInterval, interval);
      }
    }
  };
  return {
    name,
    start: () => {
      logger.info(`task "${name}" started`);
      timer = setTimeout(doInterval, startDelay);
      stopped = false;
    },
    stop: async () => {
      logger.info(`task "${name}" stopped`);
      stopped = true;
      if (timer) {
        clearTimeout(timer);
      }
      return true;
    },
  };
}
