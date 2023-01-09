import { ethers } from "ethers";
import { logger } from '../utils/logger';
import { loadDB, MongoDB } from '../db';
import { DbOperator } from '../types/database.d';
import { getTimestamp } from '../utils';
import { 
  POLYGON_ENDPOINT,
  PROFILE_COLL,
  PUBLICATION_COLL,
  CURSOR_COLL,
  WHITELIST_COLL,
} from "../config";

export function createDBOperator(db: MongoDB): DbOperator {
  const insertOne = async (collName: string, data: any): Promise<void> => {
    try {
      await db.dbHandler.collection(collName).insertOne(data);
    } catch (e: any) {
      if (e.code !== 11000)
        throw new Error(`Insert data failed, message:${e}`);
    }
  }

  const insertMany = async (collName: string, data: any): Promise<void> => {
    try {
      await db.dbHandler.collection(collName).insertMany(data);
    } catch (e: any) {
      if (e.code !== 11000)
        throw new Error(`Insert many data failed, message:${e}`);
    }
  }

  const insertWhitelist = async (data: any): Promise<any> => {
    try {
      return await db.dbHandler.collection(WHITELIST_COLL).insertOne(data);
    } catch (e: any) {
      if (e.code !== 11000)
        throw new Error(`Insert whitelist failed, message:${e}`);
    }
  }

  const insertWhitelists = async (data: any[]): Promise<any> => {
    try {
      if (data.length === 0) {
        return;
      }
      const options = { ordered: false };
      return await db.dbHandler.collection(WHITELIST_COLL).insertMany(data, options);
    } catch (e: any) {
      if (e.code !== 11000)
        throw new Error(`Insert whitelists failed, message:${e}`);
    }
  }

  const insertProfile = async (data: any): Promise<any> => {
    try {
      return await db.dbHandler.collection(PROFILE_COLL).insertOne(data);
    } catch (e: any) {
      if (e.code !== 11000)
        throw new Error(`Insert profile failed, message:${e}`);
    }
  }

  const insertProfiles = async (data: any[]): Promise<any> => {
    try {
      if (data.length === 0) {
        return;
      }
      const options = { ordered: false };
      return await db.dbHandler.collection(PROFILE_COLL).insertMany(data, options);
    } catch (e: any) {
      if (e.code !== 11000)
        throw new Error(`Insert profiles failed, message:${e}`);
    }
  }

  const insertPublications = async (data: any[]): Promise<void> => {
    try {
      if (data.length === 0) {
        return;
      }
      const options = { ordered: false };
      return await db.dbHandler.collection(PUBLICATION_COLL).insertMany(data, options);
    } catch (e: any) {
      if (e.code !== 11000)
        throw new Error(`Insert publications failed, message:${e}`);
    }
  }

  const deleteOne = async (collName: string, query: any): Promise<void> => {
    await db.dbHandler.collection(collName).deleteOne(collName, query);
  }

  const deleteMany = async (collName: string, query: any): Promise<void> => {
    await db.dbHandler.collection(collName).deleteMany(collName, query);
  }

  const updateProfileCursor = async (cursor: any, status?: string): Promise<void> => {
    const query = { _id: 'profile' };
    const updateData = { 
      value: cursor, 
      status: status,
    };
    const options = { upsert: true }; await db.dbHandler.collection(CURSOR_COLL).updateOne(query, { $set: updateData }, options);
  }

  const updatePublicationCursor = async (id: string, cursor: string): Promise<void> => {
    const query = { _id: id };
    const updateData = { publicationCursor: cursor };
    const options = { upsert: true };
    await db.dbHandler.collection(PROFILE_COLL).updateOne(query, { $set: updateData }, options);
  }

  const updateProfile = async (data: any): Promise<void> => {
    const query = { _id: data._id };
    const options = { upsert: true };
    await db.dbHandler.collection(PROFILE_COLL).replaceOne(query, data, options);
  }

  const updateProfileTimestamp = async (id: string, timestamp: number): Promise<void> => {
    const query = { _id: id };
    const updateData = { lastUpdateTimestamp: timestamp };
    await db.dbHandler.collection(PROFILE_COLL).updateOne(query, { $set: updateData });
  }

  const updateProfileCursorAndTimestamp = async (id: string, cursor: string, timestamp: number): Promise<void> => {
    const query = { _id: id };
    const updateData = { 
      publicationCursor: cursor,
      lastUpdateTimestamp: timestamp,
    };
    await db.dbHandler.collection(PROFILE_COLL).updateOne(query, { $set: updateData });
  }

  const getProfileCursor = async (): Promise<string> => {
    const cursor = await db.dbHandler.collection(CURSOR_COLL).findOne({_id: 'profile'})
    if (cursor === null)
      return '{}';

    return cursor.value;
  }

  const getPublicationCursor = async (id: string): Promise<string> => {
    const cursor = await db.dbHandler.collection(PROFILE_COLL).findOne({_id: id});
    if (cursor === null)
      return '{}';

    if (cursor.publicationCursor === null || cursor.publicationCursor === undefined)
      return '{}';

    return cursor.publicationCursor;
  }

  const getProfileIdsWithLimit = async (limit?: number): Promise<string[]> => {
    if (limit === null || limit === undefined) {
      limit = 1000;
    }

    const lastUpdateTimestamp = await getOrSetLastUpdateTimestamp();
    const res: string[] = [];
    const items = await db.dbHandler.collection(PROFILE_COLL).find(
      {
        $or: [
          {publicationCursor: {$exists: false}},
          {lastUpdateTimestamp: {$exists: false}},
          {lastUpdateTimestamp: {$lt: lastUpdateTimestamp}},
        ]
      },
      {
        _id: 1,
      }
    ).limit(limit).toArray();
    for (const item of items) {
      res.push(item._id);
    }
    return res;
  }

  const setSyncedBlockNumber = async (blockNumber: number): Promise<void> => {
    const query = { _id: 'syncedBlock' };
    const updateData = { value: blockNumber };
    const options = { upsert: true }; 
    await db.dbHandler.collection(CURSOR_COLL).updateOne(query, { $set: updateData }, options);
  }

  const getSyncedBlockNumber = async (): Promise<number> => {
    const res = await db.dbHandler.collection(CURSOR_COLL).findOne({_id:'syncedBlock'});
    if (res === null)
      return -1;

    return res.value;
  }

  const setStartBlockNumber = async (): Promise<void> => {
    try {
      const res = await db.dbHandler.collection(CURSOR_COLL).findOne({_id:'startBlock'});
      if (res !== null)
        return;

      const provider = new ethers.providers.JsonRpcProvider(POLYGON_ENDPOINT);
      const startBlockNumber = await provider.getBlockNumber();
      logger.info(`Set monitor start block number to ${startBlockNumber}`);
      const query = { _id: 'startBlock' };
      const updateData = { value: startBlockNumber };
      const options = { upsert: true }; 
      await db.dbHandler.collection(CURSOR_COLL).updateOne(query, { $set: updateData }, options);
    } catch (e: any) {
      logger.error(`Update start block number failed, message:${e}`);
    }
  }

  const setStop = async (): Promise<void> => {
    try {
      await db.dbHandler.collection(CURSOR_COLL).insertOne({ _id: 'stop' });
    } catch (e: any) {
      if (e.code !== 11000)
        throw new Error(`Insert many data failed, message:${e}`);
    }
  }

  const getStop = async (): Promise<boolean> => {
    const res = await db.dbHandler.collection(CURSOR_COLL).findOne({_id:'stop'});
    return res !== null;
  }

  const deleteStop = async (): Promise<void> => {
    await db.dbHandler.collection(CURSOR_COLL).deleteOne({_id:'stop'});
  }

  const getStartBlockNumber = async (): Promise<number> => {
    const res = await db.dbHandler.collection(CURSOR_COLL).findOne({_id:'startBlock'});
    if (res === null)
      return -1;

    return res.value;
  }

  const getStatus = async (): Promise<any> => {
    const profileStats = await db.dbHandler.collection(PROFILE_COLL).stats({scale:1024});
    const publicationStats = await db.dbHandler.collection(PUBLICATION_COLL).stats({scale:1024});
    return {
      profile: {
        count: profileStats.count,
        size: profileStats.size,
      },
      publication: {
        count: publicationStats.count,
        size: publicationStats.size,
      },
    };
  }

  const getWhiteList = async (): Promise<string[]> => {
    const res = await db.dbHandler.collection(WHITELIST_COLL).distinct("_id");
    if (res === null)
      return [];

    return res;
  }

  const setLastUpdateTimestamp = async (timestamp: number): Promise<void> => {
    const query = { _id: 'timestamp' };
    const updateData = { lastUpdateTimestamp: timestamp };
    const options = { upsert: true };
    await db.dbHandler.collection(CURSOR_COLL).updateOne(query, { $set: updateData }, options);
  }

  const getOrSetLastUpdateTimestamp = async (): Promise<number> => {
    const timestamp = await db.dbHandler.collection(CURSOR_COLL).findOne({_id:'timestamp'});
    if (timestamp !== null) {
      return timestamp.lastUpdateTimestamp;
    }

    const lastUpdateTimestamp = getTimestamp();
    const query = { _id: 'timestamp' };
    const updateData = { lastUpdateTimestamp: lastUpdateTimestamp };
    const options = { upsert: true };
    await db.dbHandler.collection(CURSOR_COLL).updateOne(query, { $set: updateData }, options);

    return lastUpdateTimestamp;
  }

  const getWhitelistProfileIds = async (): Promise<string[]> => {
    const addresses = await getWhiteList();
    const profileIds: string[] = [];
    for (const address of addresses) {
      const items = await db.dbHandler.collection(PROFILE_COLL).find({ownedBy:address},{_id:1}).toArray()
      for (const item of items) {
        profileIds.push(item._id);
      }
    }
    return profileIds;
  }

  return {
    insertOne,
    insertMany,
    insertWhitelist,
    insertWhitelists,
    insertProfile,
    insertProfiles,
    insertPublications,
    deleteOne,
    deleteMany,
    deleteStop,
    updateProfile,
    updateProfileCursor,
    updateProfileTimestamp,
    updatePublicationCursor,
    updateProfileCursorAndTimestamp,
    setSyncedBlockNumber,
    setStartBlockNumber,
    setStop,
    setLastUpdateTimestamp,
    getStop,
    getProfileCursor,
    getPublicationCursor,
    getProfileIdsWithLimit,
    getSyncedBlockNumber,
    getStartBlockNumber,
    getStatus,
    getWhiteList,
    getWhitelistProfileIds,
    getOrSetLastUpdateTimestamp,
  }
}
