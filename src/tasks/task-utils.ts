import { Task } from '../types/tasks';
import { formatError } from '../utils';
import { logger } from '../utils/logger';

export async function makeIntervalTask(
  startDelay: number,
  interval: number, // in millseconds
  name: string,
  handlerFn: () => Promise<void>,
): Promise<Task> {
  logger.info('start task: "%s"', name);
  if (startDelay <= 0 || interval <= 0) {
    throw new Error('invalid arg, interval should be greater than 0');
  }
  let timer: NodeJS.Timeout;
  let stopped = false;

  const doInterval = async () => {
    if (stopped) {
      return;
    }
    try {
      await handlerFn();
    } catch (e) {
      logger.error(
        'unexpected execption running task "%s", %s',
        name,
        formatError(e),
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
      handlerFn();
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
