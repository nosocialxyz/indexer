import { ethers } from "ethers";
import { logger } from '../utils/logger';
import {
  LENS_HUB_CONTRACT,
  LENS_PERIPHERY_CONTRACT,
} from '../config';


export async function monitorLensContract() {
  logger.info('monitor lens protocol');
  const abi = [
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
  const iface = new ethers.utils.Interface(abi);
  //const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com/");
  const provider = new ethers.providers.JsonRpcProvider("https://billowing-silent-friday.matic.discover.quiknode.pro/1d4fafb9f0722f3d64de51b10ab032bc0b1da6ee/");
  const filter = {
    address: LENS_HUB_CONTRACT,
    topics: [
      [
        ethers.utils.id("PostCreated(uint256,uint256,string,address,bytes,address,bytes,uint256)"),
        ethers.utils.id("ProfileCreated(uint256,address,address,string,string,address,bytes,string,uint256)"),
        ethers.utils.id("CommentCreated(uint256,uint256,string,uint256,uint256,bytes,address,bytes,address,bytes,uint256)"),
        ethers.utils.id("DefaultProfileSet(address,uint256,uint256)"),
      ]
    ],
    fromBlock: 36853895,
  }
  provider.on(filter, (log: any, event: any) => {
    //const events = log.map((l:any) => iface.parseLog(l));
    const txt = iface.parseLog(log);
    console.log(`${txt.name} ${txt.args.profileId._hex}`);
    //console.log(txt.args.profileId._hex);
    //console.log(JSON.stringify(iface.parseLog(log)));
  })
}
