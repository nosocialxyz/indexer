import axios, { AxiosRequestConfig } from "axios";
import { API_URL } from "../config";
import { NFTStatus } from "../types/nfts.d";

export async function getNextNFT2Mint() {
  const fetchNextNFT: AxiosRequestConfig = {
    method: "get",
    url: `${API_URL}/api/v0/nft/fetchNft2Mint`,
  };
  const nextNFT = await axios(fetchNextNFT);
  return nextNFT.data;
}

export async function getNextNFT2Update() {
  const fetchNextNFT: AxiosRequestConfig = {
    method: "get",
    url: `${API_URL}/api/v0/nft/fetchNft2Update`,
  };
  const nextNFT = await axios(fetchNextNFT);
  return nextNFT.data;
}

export async function updateWaitingNFTStatus(nftStatus: NFTStatus) {
  const updateWaitingNFT: AxiosRequestConfig = {
    method: "post",
    url: `${API_URL}/api/v0/nft/updateNft`,
    data: nftStatus,
  };
  const response = await axios(updateWaitingNFT);
  return response.data;
}
