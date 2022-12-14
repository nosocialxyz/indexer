import { META_PATH } from "../config";
import { BigNumber } from "ethers";
const fs = require("fs");

export interface IAttribute {
  trait_type: string;
  value: string;
}

export interface IBaseMetaData {
  description: string;
  external_url: string;
  image: string;
  name: string;
  attributes: IAttribute[];
}

export interface IMetaData extends IBaseMetaData {
  date?: number;
  [key: string]: any;
}

export function generateMetadata(nft: any, tokenId: string) {
  const date = Date.now();
  const metadata: IMetaData = {
    name: nft.name,
    external_url: "https://nosocial.xyz/",
    description: nft.description,
    image: nft.pic_url,
    date: date,
    attributes: [
      { trait_type: "trait_type", value: nft.profileId },
      { trait_type: "category", value: nft.category },
      { trait_type: "provider", value: nft.provider },
      { trait_type: "type", value: nft.type },
      { trait_type: "nftId", value: nft.nftId },
    ],
  };
  const metaPath = META_PATH + String(BigNumber.from(tokenId)) + ".json";
  const metadataJson = JSON.stringify(metadata);
  fs.writeFileSync(metaPath, metadataJson);
  return metaPath;
}
