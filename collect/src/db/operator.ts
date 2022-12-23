import { ethers } from "ethers";
import { logger } from '../utils/logger';
import { loadDB, MongoDB } from '../db';
import { DbOperator } from '../types/database.d';
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

  const insertProfile = async (data: any): Promise<any> => {
    try {
      return await db.dbHandler.collection(PROFILE_COLL).insertOne(data);
    } catch (e: any) {
      if (e.code !== 11000)
        throw new Error(`Insert profile failed, message:${e}`);
    }
  }

  const insertProfiles = async (data: any): Promise<any> => {
    try {
      const options = { ordered: false };
      return await db.dbHandler.collection(PROFILE_COLL).insertMany(data, options);
    } catch (e: any) {
      if (e.code !== 11000)
        throw new Error(`Insert profiles failed, message:${e}`);
    }
  }

  const insertPublications = async (data: any): Promise<void> => {
    try {
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

  const isUpdateFinished = async (): Promise<boolean> => {
    const query = { _id: 'profile' };
    const res = await db.dbHandler.collection(CURSOR_COLL).findOne(query);
    return res != null && res.status === 'complete';
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

  const incTask = async (): Promise<void> => {
    await db.dbHandler.collection(CURSOR_COLL).findOneAndUpdate(
      {_id:'tasks'},
      {$inc: {"value":1}},
      {upsert: true},
    )
  }

  const decTask = async (): Promise<void> => {
    await db.dbHandler.collection(CURSOR_COLL).findOneAndUpdate(
      {
        _id: 'tasks',
        value: {$gt: 0}
      },
      {$inc: {"value":-1}},
    )
  }

  const setTask = async (n: number): Promise<void> => {
    const query = { _id: 'tasks' };
    const updateData = { value: n };
    const options = { upsert: true }; 
    await db.dbHandler.collection(CURSOR_COLL).updateOne(query, { $set: updateData }, options);
  }

  const getTask = async (): Promise<number> => {
    const res = await db.dbHandler.collection(CURSOR_COLL).findOne({_id:'tasks'},{value:1});
    if (res !== null)
      return res.value;

    return 0;
  }

  const getProfileCursor = async (): Promise<string> => {
    const cursor = await db.dbHandler.collection(CURSOR_COLL).findOne({_id: 'profile'})
    if (cursor === null)
      return '{}';

    return cursor.value;
  }

  const getPublicationCursor = async (id: string): Promise<string> => {
    const cursor = await db.dbHandler.collection(PROFILE_COLL).findOne({_id: id});
    if (cursor == null)
      return '{}';

    if (cursor.publicationCursor === undefined)
      return '{}';

    return cursor.publicationCursor;
  }

  const getProfileIds = async (): Promise<any> => {
    const res = await db.dbHandler.collection(PROFILE_COLL).find(
      {
        $or: [
          {publicationCursor: {$exists: false}},
          {publicationCursor: {$ne: '{}'}}
        ]
      }
    );
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

  const setStop = async (stop: boolean): Promise<void> => {
    const query = { _id: 'stop' };
    const updateData = { value: stop };
    const options = { upsert: true };
    await db.dbHandler.collection(CURSOR_COLL).updateOne(query, { $set: updateData }, options);
  }

  const getStop = async (): Promise<boolean> => {
    const res = await db.dbHandler.collection(CURSOR_COLL).findOne({_id:'stop'},{value:1});
    if (res !== null)
      return res.value;

    return false;
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

  return {
    insertOne,
    insertMany,
    insertProfile,
    insertProfiles,
    insertPublications,
    deleteOne,
    deleteMany,
    updateProfile,
    updateProfileCursor,
    updatePublicationCursor,
    isUpdateFinished,
    incTask,
    decTask,
    getTask,
    setTask,
    setSyncedBlockNumber,
    setStartBlockNumber,
    setStop,
    getProfileCursor,
    getPublicationCursor,
    getProfileIds,
    getSyncedBlockNumber,
    getStartBlockNumber,
    getStatus,
    getWhiteList,
    getStop,
  }
}
