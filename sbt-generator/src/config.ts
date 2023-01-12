import fs from "fs";
import path from "path";

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

export const explicitStart = (filename: string) => {
  const scriptName = path.basename(process.argv[1]);
  return path.basename(filename).includes(scriptName);
};

export const PRIVATE_KEY = getParamOrExit("PRIVATE_KEY");

export const API_URL = getParamOrExit("API_URL");

export const META_PATH = getParamOrExit("META_PATH");

export const SC_CONTRACT = getParamOrExit("SC_CONTRACT");

export const POLYCHAIN_ENDPOINT = getParamOrExit("POLYCHAIN_ENDPOINT");
