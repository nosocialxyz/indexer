import { ethers } from "ethers";
import { logger } from '../utils/logger';
import { loadDB, MongoDB } from '../db';
import { DbOperator } from '../types/database.d';
import { 
  POLYGON_ENDPOINT,
  PROFILE_COLL,
  PUBLICATION_COLL,
  CURSOR_COLL,
} from "../config";

export function createDBOperator(db: MongoDB): DbOperator {
  const insertOne = async (collName: string, data: any): Promise<void> => {
    try {
      await db.dbHandler.collection(collName).insertOne(data);
    } catch (e: any) {
      if (e.code !== 11000)
        logger.error(`Insert data failed, message:${e}`);
    }
  }

  const insertMany = async (collName: string, data: any): Promise<void> => {
    try {
      await db.dbHandler.collection(collName).insertMany(data);
    } catch (e: any) {
      if (e.code !== 11000)
        logger.error(`Insert many data failed, message:${e}`);
    }
  }

  const insertProfiles = async (data: any): Promise<any> => {
    try {
      const options = { ordered: false };
      return await db.dbHandler.collection(PROFILE_COLL).insertMany(data, options);
    } catch (e: any) {
      if (e.code !== 11000)
        logger.error(`Insert profiles failed, message:${e}`);
    }
  }

  const insertPublications = async (data: any): Promise<void> => {
    try {
      const options = { ordered: false };
      return await db.dbHandler.collection(PUBLICATION_COLL).insertMany(data, options);
    } catch (e: any) {
      if (e.code !== 11000)
        logger.error(`Insert publications failed, message:${e}`);
    }
  }

  const deleteOne = async (collName: string, query: any): Promise<void> => {
    try {
      await db.dbHandler.collection(collName).deleteOne(collName, query);
    } catch (e: any) {
      logger.error(`Delete one data failed, message:${e}`);
    }
  }

  const deleteMany = async (collName: string, query: any): Promise<void> => {
    try {
      await db.dbHandler.collection(collName).deleteMany(collName, query);
    } catch (e: any) {
      logger.error(`Delete many data failed, message:${e}`);
    }
  }

  const isUpdateFinished = async (): Promise<boolean> => {
    const query = { _id: 'profile' };
    const res = await db.dbHandler.collection(CURSOR_COLL).findOne(query);
    return res != null && res.status === 'complete';
  }

  const updateProfileCursor = async (cursor: any, status?: string): Promise<void> => {
    try {
      const query = { _id: 'profile' };
      const updateData = { 
        value: cursor, 
        status: status,
      };
      const options = { upsert: true }; await db.dbHandler.collection(CURSOR_COLL).updateOne(query, { $set: updateData }, options);
    } catch (e: any) {
      logger.error(`Update profile cursor failed, message:${e}`);
    }
  }

  const updatePublicationCursor = async (id: string, cursor: string): Promise<void> => {
    try {
      const query = { _id: id };
      const updateData = { publicationCursor: cursor };
      const options = { upsert: true };
      await db.dbHandler.collection(PROFILE_COLL).updateOne(query, { $set: updateData }, options);
    } catch (e: any) {
      logger.error(`Update publication cursor failed, message:${e}`);
    }
  }

  const updateProfile = async (data: any) => {
    try {
      const query = { _id: data._id };
      const options = { upsert: true };
      await db.dbHandler.collection(PROFILE_COLL).replaceOne(query, data, options);
    } catch (e: any) {
      logger.error(`Update profile(${data._id}) failed, message:${e}`);
    }
  }

  const getProfileCursor = async (): Promise<string> => {
    try {
      const cursor = await db.dbHandler.collection(CURSOR_COLL).findOne({
        _id: 'profile',
      });
      if (cursor === null) {
        return '{}';
      } else {
        return cursor.value;
      }
    } catch (e: any) {
      logger.error(`Get profile cursor failed, message:${e}`);
      return '{}';
    }
  }

  const getPublicationCursor = async (id: string): Promise<string> => {
    try {
      const cursor = await db.dbHandler.collection(PROFILE_COLL).findOne({
        _id: id,
      });
      if (cursor == null) {
        return '{}';
      } else {
        if (cursor.publicationCursor === undefined)
          return '{}';
        return cursor.publicationCursor;
      }
    } catch (e: any) {
      logger.error(`Get publication cursor failed, message:${e}`);
      return '{}';
    }
  }

  const getProfileIds = async (): Promise<any> => {
    try {
      const res = await db.dbHandler.collection(PROFILE_COLL).find(
        {
          $or: [
            {publicationCursor: {$exists: false}},
            {publicationCursor: {$ne: '{}'}}
          ]
        }
      );
      return res;
    } catch (e: any) {
      logger.error(`Get not null publication cursor failed, message:${e}`);
      return [];
    }
  }

  const setSyncedBlockNumber = async (blockNumber: number): Promise<void> => {
    try {
      const query = { _id: 'syncedBlock' };
      const updateData = { value: blockNumber };
      const options = { upsert: true }; 
      await db.dbHandler.collection(CURSOR_COLL).updateOne(query, { $set: updateData }, options);
    } catch (e: any) {
      logger.error(`Update start block number failed, message:${e}`);
    }
  }

  const getSyncedBlockNumber = async (): Promise<number> => {
    try {
      const res = await db.dbHandler.collection(CURSOR_COLL).findOne({_id:'syncedBlock'});
      if (res === null)
        return -1;

      return res.value;
    } catch (e: any) {
      throw new Error(`Get synced block number failed, message:${e}`);
    }
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

  const getStartBlockNumber = async (): Promise<number> => {
    try {
      const res = await db.dbHandler.collection(CURSOR_COLL).findOne({_id:'startBlock'});
      if (res === null)
        return -1;

      return res.value;
    } catch (e: any) {
      throw new Error(`Get start block number failed, message:${e}`);
    }
  }

  const getStatus = async (): Promise<any> => {
    try {
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
    } catch (e: any) {
      throw new Error(`Get status failed, error:${e}`);
    }
  }

  return {
    insertOne,
    insertMany,
    insertProfiles,
    insertPublications,
    deleteOne,
    deleteMany,
    updateProfile,
    updateProfileCursor,
    updatePublicationCursor,
    isUpdateFinished,
    setSyncedBlockNumber,
    setStartBlockNumber,
    getProfileCursor,
    getPublicationCursor,
    getProfileIds,
    getSyncedBlockNumber,
    getStartBlockNumber,
    getStatus,
  }
}
