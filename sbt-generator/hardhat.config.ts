import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import path from "path";

const getParamOrExit = (name: string) => {
  const param = process.env[name];
  if (!param) {
    console.error(`Required config param '${name}' missing`);
    process.exit(1);
  }
  return param;
};

export const PRIVATE_KEY = getParamOrExit("PRIVATE_KEY");
export const POLYCHAIN_ENDPOINT = getParamOrExit("POLYCHAIN_ENDPOINT");
export const SCAN_API_KEY = getParamOrExit("SCAN_API_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  defaultNetwork: "polychain",
  networks: {
    polychain: {
      url: POLYCHAIN_ENDPOINT,
      accounts: [PRIVATE_KEY.substring(2)],
    },
  },
  etherscan: {
    apiKey: SCAN_API_KEY,
  },
};

export default config;
