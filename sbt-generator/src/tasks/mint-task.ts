import Bluebird from "bluebird";
import { getNextNFT2Mint, updateWaitingNFTStatus } from "../operation/api";
import { makeIntervalTask } from "./task-utils";
import { NFTStatus } from "../types/nfts.d";
import { AppContext } from "../types/context.d";
import { Logger } from "winston";
import { SimpleTask } from "../types/tasks.d";
import { IsStopped } from "./task-utils";
import { mintNft } from "../operation/nfts";
import { BigNumber } from "ethers";

async function handleNFT(
  _: AppContext,
  logger: Logger,
  _isStopped: IsStopped
): Promise<void> {
  try {
    const res = await getNextNFT2Mint();
    if (res != null) {
      logger.info(`The next nft to mint is: ${JSON.stringify(res)}`);
      const cid = BigNumber.from(res.nftId);
      const address = res.ownedBy;
      logger.info(`The next nft is ${cid}, owned by ${address}`);
      const txhash = await mintNft(address, cid, logger);
      logger.info(`The minted nft txhash: ${txhash}`);
      const nftStatus: NFTStatus = {
        id: res.id,
        txhash: txhash,
      };
      const updated = await updateWaitingNFTStatus(nftStatus);
      logger.info(`Updated status ${updated}`);
    } else {
      logger.info("No waiting nft to mint");
    }
  } catch (e: any) {
    logger.error(`Get next nft error, error:${e}`);
    if (e.networkError && e.networkError.statusCode === 429)
      await Bluebird.delay(60 * 1000);
  }
}

export async function createNFTTask(
  context: AppContext,
  loggerParent: Logger
): Promise<SimpleTask> {
  const interval = 10 * 1000;
  return makeIntervalTask(
    0,
    interval,
    "mint-nft",
    context,
    loggerParent,
    handleNFT,
    "🧑"
  );
}
