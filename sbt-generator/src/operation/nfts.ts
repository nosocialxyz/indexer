const hre = require("hardhat");

import type { StarNFTV4 } from "../typechain-types";
import { StarNFTV4__factory } from "../typechain-types/factories/contracts/nft.sol";
import { calcGas } from "../utils/polygon-gas";
import { Logger } from "winston";
import { BigNumber } from "ethers";
import { PRIVATE_KEY, SC_CONTRACT, POLYCHAIN_ENDPOINT } from "../config";

export async function mintNft(address: string, cid: BigNumber, logger: Logger) {
  const provider = new hre.ethers.providers.JsonRpcProvider(POLYCHAIN_ENDPOINT);
  const privateKey = PRIVATE_KEY;
  const wallet = new hre.ethers.Wallet(privateKey, provider);
  let NFTV4: StarNFTV4;
  NFTV4 = StarNFTV4__factory.connect(SC_CONTRACT, wallet);

  const gasEstimated = await NFTV4.estimateGas.mint(address, cid);
  const gas = await calcGas(gasEstimated);
  const tx = await NFTV4.mint(address, cid, gas);
  logger.info(`Mint successfully with tx ${JSON.stringify(tx)}`);

  const txhash = tx.hash;

  logger.info(`Mint successful with txhash ${txhash}`);
  return txhash;
}

export async function updateTokenId(txhash: string, logger: Logger) {
  const provider = new hre.ethers.providers.JsonRpcProvider(POLYCHAIN_ENDPOINT);
  const privateKey = PRIVATE_KEY;
  const wallet = new hre.ethers.Wallet(privateKey, provider);
  let NFTV4: StarNFTV4;
  NFTV4 = StarNFTV4__factory.connect(SC_CONTRACT, wallet);

  const receipt = await provider.getTransactionReceipt(txhash);
  if (receipt == null) {
    logger.info(`The receipt is not ready`);
    return "";
  }
  logger.info(`The receipt is ${JSON.stringify(receipt)}`);
  const eventsFilter = await NFTV4.filters.Transfer();
  const events = await NFTV4.queryFilter(
    eventsFilter,
    receipt.blockNumber,
    receipt.blockNumber
  );

  const tokenId = events[0].args[2]._hex;

  logger.info(`Get tokenID ${tokenId} successfully with txhash ${txhash}`);
  return tokenId;
}
