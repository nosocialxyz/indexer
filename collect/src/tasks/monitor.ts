import Bluebird from 'bluebird';
import { ethers } from "ethers";
import { AppContext } from '../types/context.d';
import { DbOperator } from '../types/database.d';
import { createDBOperator } from '../db/operator';
import { getProfiles } from '../operation';
import { makeIntervalTask } from './task-utils';
import { Logger } from 'winston';
import { SimpleTask } from '../types/tasks.d';
import { IsStopped } from './task-utils';
import { getTimestamp } from '../utils';
import { getPublication } from './publication-task';
import {
  LENS_DATA_LIMIT,
  LENS_HUB_CONTRACT,
  LENS_PERIPHERY_CONTRACT,
  LENS_HUB_EVENT_ABI,
  LENS_PERIPHERY_EVENT_ABI,
  LENS_HUB_TOPICS,
  LENS_PERIPHERY_TOPICS,
  POLYGON_ENDPOINT,
  MAX_TASK,
} from '../config';


export async function handleMonitor(
  context: AppContext,
  logger: Logger,
  isStopped: IsStopped,
): Promise<void> {
  const db = context.database;
  const dbOperator = createDBOperator(db);
  context.logger = logger;
  let fromBlock = await dbOperator.getSyncedBlockNumber();
  if (fromBlock === -1) {
    fromBlock = await dbOperator.getStartBlockNumber();
    if (fromBlock === -1) {
      throw new Error('Monitor lens block: get start block number failed.');
    }
  }

  const provider = new ethers.providers.JsonRpcProvider(POLYGON_ENDPOINT);
  const lensHubIface = new ethers.utils.Interface(LENS_HUB_EVENT_ABI);
  const lensPeripheryIface = new ethers.utils.Interface(LENS_PERIPHERY_EVENT_ABI);
  let toBlock = fromBlock + 2000;
  logger.info(`from:${fromBlock}, to:${toBlock}`)

  try {
    const currentBlockNumber = await provider.getBlockNumber();
    if (toBlock > currentBlockNumber) {
      toBlock = currentBlockNumber;
    }
    const lensHubFilter = {
      address: LENS_HUB_CONTRACT,
      topics: [
        LENS_HUB_TOPICS
      ],
      fromBlock: fromBlock,
      toBlock: toBlock,
    }
    const lensPeripheryFilter = {
      address: LENS_PERIPHERY_CONTRACT,
      topics: [
        LENS_PERIPHERY_TOPICS
      ],
      fromBlock: fromBlock,
      toBlock: toBlock,
    }

    let profileIds: string[] = [];
    // Get lens hub logs
    const lensHubLogs = await provider.getLogs(lensHubFilter);
    for (const log of lensHubLogs) {
      const event = lensHubIface.parseLog(log);
      profileIds.push(event.args.profileId._hex)
    }
    // Get lens periphery logs
    const lensPeripheryLogs = await provider.getLogs(lensPeripheryFilter);
    for (const log of lensPeripheryLogs) {
      const event = lensPeripheryIface.parseLog(log);
      if (event.args.hasOwnProperty('profileId')) {
        profileIds.push(event.args.profileId._hex)
      } else if (event.args.hasOwnProperty('profileIds')) {
        for (const id of event.args.profileIds) {
          profileIds.push(id._hex)
        }
      }
    }
    profileIds = Array.from(new Set(profileIds));
    logger.info(`Get new profile number:${profileIds.length}`);
    await updateProfiles(context, profileIds, isStopped);
    await dbOperator.setSyncedBlockNumber(toBlock);
  } catch (e: any) {
    logger.error(`Get logs from polychain failed,error:${e}.`);
  }
}

export async function createMonitorTask(
  context: AppContext,
  loggerParent: Logger,
): Promise<SimpleTask> {
  const interval = 5 * 1000;
  return makeIntervalTask(
    0,
    interval,
    'monitor-chain',
    context,
    loggerParent,
    handleMonitor,
    '👀',
  )
}

async function updateProfiles(
  context: AppContext, 
  profileIds: string[], 
  isStopped: IsStopped,
): Promise<void> {
  const logger = context.logger;
  const dbOperator = createDBOperator(context.database);
  let offset = 0;
  while (offset < profileIds.length) {
    try {
      await Bluebird.delay(1 * 1000);
      const profiles = await getProfiles({
        profileIds: profileIds.slice(offset,offset+LENS_DATA_LIMIT),
        limit: LENS_DATA_LIMIT,
      })

      await dbOperator.insertProfiles(profiles.items);

      if (profiles.items.length < LENS_DATA_LIMIT) {
        break;
      }

      offset = offset + LENS_DATA_LIMIT;
    } catch (e: any) {
      logger.error(`Get profiles failed,error:${e}`);
      if (e.statusCode === 404)
        break;

      if (e.networkError.statusCode === 429)
        await Bluebird.delay(5 * 60 * 1000);
    }
  }

  // Update publications
  context.timestamp = getTimestamp();
  await Bluebird.map(profileIds, async (id) => {
    if (!isStopped()) {
      await getPublication(context, id);
    }
  }, { concurrency: MAX_TASK/2 });
}
