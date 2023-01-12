import { ethers } from "hardhat";

async function main() {
  const NFT = await ethers.getContractFactory("StarNFTV4");
  const nft = await NFT.deploy();

  await nft.deployed();

  console.log(`nft contract deployed to ${nft.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
