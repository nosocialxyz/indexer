import Bluebird from "bluebird";
import { getNextNFT2Update, updateWaitingNFTStatus } from "../operation/api";
import { makeIntervalTask } from "./task-utils";
import { NFTStatus } from "../types/nfts.d";
import { AppContext } from "../types/context.d";
import { Logger } from "winston";
import { SimpleTask } from "../types/tasks.d";
import { IsStopped } from "./task-utils";
import { updateTokenId } from "../operation/nfts";
import { generateMetadata } from "../operation/create-metadata";

async function handleNFT(
  _: AppContext,
  logger: Logger,
  _isStopped: IsStopped
): Promise<void> {
  try {
    const res = await getNextNFT2Update();
    if (res != null && res.txhash != null && res.txhash != "") {
      logger.info(`The next nft to update tokenid is: ${JSON.stringify(res)}`);
      const tokenId = await updateTokenId(res.txhash, logger);
      if (tokenId === "") {
        logger.info(`Tokenid is not ready to update right now`);
        return;
      }
      logger.info(`The updated tokenId is ${tokenId}`);
      const nftStatus: NFTStatus = {
        id: res.id,
        tokenId: tokenId,
      };
      const updated = await updateWaitingNFTStatus(nftStatus);
      logger.info(`Updated status ${updated}`);
      const metaPath = generateMetadata(res, tokenId);
      logger.info(`Generate metadata succussfully in ${metaPath}`);
    } else {
      logger.info("No waiting nft to update tokenid");
    }
  } catch (e: any) {
    logger.error(`Get next nft error, error:${e}`);
    if (e.networkError && e.networkError.statusCode === 429)
      await Bluebird.delay(60 * 1000);
  }
}

export async function createTokenIdTask(
  context: AppContext,
  loggerParent: Logger
): Promise<SimpleTask> {
  const interval = 10 * 1000;
  return makeIntervalTask(
    0,
    interval,
    "update-token-id",
    context,
    loggerParent,
    handleNFT,
    "🧑"
  );
}
