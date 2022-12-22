import fs from 'fs';
import path from 'path';
import { ethers } from "ethers";

const fileLensHub = fs.readFileSync(
  path.join(__dirname, 'abis/lens-hub-contract-abi.json'),
  'utf8'
);
const fileLensPeriphery = fs.readFileSync(
  path.join(__dirname, 'abis/lens-periphery-data-provider.json'),
  'utf8'
);
const fileFollowNFT = fs.readFileSync(
  path.join(__dirname, 'abis/lens-follow-nft-contract-abi.json'),
  'utf8'
);

const getParamOrExit = (name: string) => {
  const param = process.env[name];
  if (!param) {
    console.error(`Required config param '${name}' missing`);
    process.exit(1);
  }
  return param;
};

const getParam = (name: string) => {
  const param = process.env[name];
  if (!param) {
    return null;
  }
  return param;
};

const getTopics = (tags: string[]) => {
  const res: string[] = [];
  for (const tag of tags) {
    res.push(ethers.utils.id(tag));
  }
  return res;
}

export const explicitStart = (filename: string) => {
  const scriptName = path.basename(process.argv[1]);
  return path.basename(filename).includes(scriptName);
};

export const PK = getParamOrExit('PK');

export const MUMBAI_RPC_URL = getParamOrExit('MUMBAI_RPC_URL');

export const LENS_API = getParamOrExit('LENS_API');

export const LENS_HUB_CONTRACT = getParamOrExit('LENS_HUB_CONTRACT');

export const LENS_PERIPHERY_CONTRACT = getParamOrExit('LENS_PERIPHERY_CONTRACT');

export const LENS_PERIPHERY_NAME = 'LensPeriphery';

export const PROFILE_ID = getParam('PROFILE_ID');

export const LENS_FOLLOW_NFT_ABI = JSON.parse(fileFollowNFT);

export const LENS_HUB_ABI = JSON.parse(fileLensHub);

export const LENS_PERIPHERY_ABI = JSON.parse(fileLensPeriphery);

export const INFURA_PROJECT_ID = getParam('INFURA_PROJECT_ID');

export const INFURA_SECRET = getParam('INFURA_SECRET');

export const PORT = 12345;

export const DB_PATH = "/opt/nosocial/db";

export const mongoServURI = 'mongodb://localhost:27017';

export const LENS_DATA_LIMIT = 50;

export const DBNAME = 'test';
export const PROFILE_COLL = 'profile';
export const PUBLICATION_COLL = 'publication';
export const CURSOR_COLL = 'cursor';

//export const POLYGON_ENDPOINT = "https://billowing-silent-friday.matic.discover.quiknode.pro/1d4fafb9f0722f3d64de51b10ab032bc0b1da6ee/";
export const POLYGON_ENDPOINT = "https://polygon-rpc.com/";
export const LENS_HUB_EVENT_ABI = [
  "event PostCreated(uint256 indexed profileId,uint256 indexed pubId,string contentURI,address collectModule,bytes collectModuleReturnData,address referenceModule,bytes referenceModuleReturnData,uint256 timestamp)",
  "event ProfileCreated(uint256 indexed profileId,address indexed creator,address indexed to,string handle,string imageURI,address followModule,bytes followModuleReturnData,string followNFTURI,uint256 timestamp)",
  "event DefaultProfileSet(address indexed wallet, uint256 indexed profileId, uint256 timestamp)",
  "event DispatcherSet(uint256 indexed profileId, address indexed dispatcher, uint256 timestamp)",
  "event ProfileImageURISet(uint256 indexed profileId, string imageURI, uint256 timestamp)",
  "event FollowNFTURISet(uint256 indexed profileId, string followNFTURI, uint256 timestamp)",
  "event FollowModuleSet(uint256 indexed profileId,address followModule,bytes followModuleReturnData,uint256 timestamp)",
  "event CommentCreated(uint256 indexed profileId,uint256 indexed pubId,string contentURI,uint256 profileIdPointed,uint256 pubIdPointed,bytes referenceModuleData,address collectModule,bytes collectModuleReturnData,address referenceModule,bytes referenceModuleReturnData,uint256 timestamp)",
  "event MirrorCreated(uint256 indexed profileId,uint256 indexed pubId,uint256 profileIdPointed,uint256 pubIdPointed,bytes referenceModuleData,address referenceModule,bytes referenceModuleReturnData,uint256 timestamp)",
  "event FollowNFTDeployed(uint256 indexed profileId,address indexed followNFT,uint256 timestamp)",
  "event CollectNFTDeployed(uint256 indexed profileId,uint256 indexed pubId,address indexed collectNFT,uint256 timestamp)",
  "event Collected(address indexed collector,uint256 indexed profileId,uint256 indexed pubId,uint256 rootProfileId,uint256 rootPubId,bytes collectModuleData,uint256 timestamp)",
  "event FollowNFTInitialized(uint256 indexed profileId, uint256 timestamp)",
  "event CollectNFTInitialized(uint256 indexed profileId,uint256 indexed pubId,uint256 timestamp)",
  "event FollowsApproved(address indexed owner,uint256 indexed profileId,address[] addresses,bool[] approved,uint256 timestamp)",
];
const lensHubTopics = [
  "PostCreated(uint256,uint256,string,address,bytes,address,bytes,uint256)",
  "ProfileCreated(uint256,address,address,string,string,address,bytes,string,uint256)",
  "DefaultProfileSet(address,uint256,uint256)",
  "DispatcherSet(uint256,address,uint256)",
  "ProfileImageURISet(uint256,string,uint256)",
  "FollowNFTURISet(uint256,string,uint256)",
  "FollowModuleSet(uint256,address,bytes,uint256)",
  "CommentCreated(uint256,uint256,string,uint256,uint256,bytes,address,bytes,address,bytes,uint256)",
  "MirrorCreated(uint256,uint256,uint256,uint256,bytes,address,bytes,uint256)",
  "FollowNFTDeployed(uint256,address,uint256)",
  "CollectNFTDeployed(uint256,uint256,address,uint256)",
  "Collected(address,uint256,uint256,uint256,uint256,bytes,uint256)",
  "FollowNFTInitialized(uint256,uint256)",
  "CollectNFTInitialized(uint256,uint256,uint256)",
  "FollowsApproved(address,uint256,address[],bool[],uint256)",
]
export const LENS_PERIPHERY_EVENT_ABI = [
  "event FollowsToggled(address indexed owner,uint256[] profileIds,bool[] enabled,uint256 timestamp)",
  "event ProfileMetadataSet(uint256 indexed profileId, string metadata, uint256 timestamp)",
];
const lensPeripheryTopics = [
  "FollowsToggled(address,uint256[],bool[],uint256)",
  "ProfileMetadataSet(uint256,string,uint256)",
]
export const LENS_HUB_TOPICS = getTopics(lensHubTopics);
export const LENS_PERIPHERY_TOPICS = getTopics(lensPeripheryTopics);
