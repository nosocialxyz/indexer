import Bluebird from 'bluebird';
import { AppContext } from '../types/context.d';
import { getProfilesByAddress } from '../operation';
import { createDBOperator } from '../db/operator';

export async function createUpdateTask(context: AppContext) {
  const logger = context.logger;
  const dbOperator = await createDBOperator(context.database);
  while (true) {
    try {
      // Update white list
      const addresses = await dbOperator.getWhiteList();
      await Bluebird.map(addresses, async (address: string) => {
        const profiles = await getProfilesByAddress(address);
        for (const profile of profiles) {
          dbOperator.updateProfile(profile);
        }
      })
    } catch (e: any) {
      logger.error(`Update white list failed, error:${e}`);
    }

    await Bluebird.delay(15 * 1000);
  }
}
