import Bluebird from 'bluebird';
import { ethers } from "ethers";
import { AppContext } from '../types/context.d';
import { DbOperator } from '../types/database.d';
import { createDBOperator } from '../db/operator';
import { getProfiles } from '../operation';
import { updatePublications } from './publication-task';
import {
  LENS_DATA_LIMIT,
  LENS_HUB_CONTRACT,
  LENS_PERIPHERY_CONTRACT,
  LENS_HUB_EVENT_ABI,
  LENS_PERIPHERY_EVENT_ABI,
  LENS_HUB_TOPICS,
  LENS_PERIPHERY_TOPICS,
  POLYGON_ENDPOINT,
} from '../config';


export async function monitorLensContract(context: AppContext) {
  const logger = context.logger;
  logger.info('monitor lens protocol');
  const db = context.database;
  const dbOperator = await createDBOperator(db);
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
  while (true) {
    let toBlock = fromBlock + 1000;
    logger.info(`from:${fromBlock}, to:${toBlock}`)
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

    try {
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
        profileIds.push(event.args.profileId._hex)
      }
      profileIds = Array.from(new Set(profileIds));
      logger.info(`Get new profile number:${profileIds.length}`);
      await updateProfilesAndPublications(context, profileIds);
      fromBlock = toBlock;
      await dbOperator.setSyncedBlockNumber(toBlock);
    } catch (e: any) {
      logger.error(`Get logs from polychain failed,error:${e}.`);
    }

    await Bluebird.delay(15 * 1000);
  }
}

async function updateProfilesAndPublications(context: AppContext, profileIds: string[]) {
  const logger = context.logger;
  const db = context.database;
  const dbOperator = await createDBOperator(db);
  let cursor = '{}';
  let offset = 0;
  while (true) {
    try {
      await Bluebird.delay(1 * 1000);
      const res = await getProfiles({
        profileIds: profileIds.slice(offset,offset+LENS_DATA_LIMIT),
        limit: LENS_DATA_LIMIT,
        cursor: cursor,
      })

      await Bluebird.map(res.items, async (profile: any) => {
        await dbOperator.updateProfile(profile);
      })

      if (res.items.length < LENS_DATA_LIMIT)
        break;

      cursor = res.pageInfo.next;
      offset = offset + LENS_DATA_LIMIT;
      if (offset >= profileIds.length)
        break;
    } catch (e: any) {
      logger.error(`Get profiles failed,error:${e}`);
      if (e.statusCode === 404)
        break;

      if (e.networkError.statusCode === 429)
        await Bluebird.delay(5 * 60 * 1000);
    }
  }
  await updatePublications(context);
}
