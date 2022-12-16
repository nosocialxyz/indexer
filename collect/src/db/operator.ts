import { logger } from '../utils/logger';
import { loadDB, MongoDB } from '../db';
import { DbOperator } from '../types/database.d';

export function createDBOperator(db: MongoDB): DbOperator {
  const profileColl = 'profile';
  const publicationColl = 'publication';
  const cursorColl = 'cursor';

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

  const deleteCursor = async (query: any): Promise<void> => {
    await deleteMany(cursorColl, query);
  }

  const updateProfileCursor = async (cursor: any): Promise<void> => {
    try {
      const query = { _id: 'profile' };
      const updateData = { value: cursor };
      const options = { upsert: true };
      await db.dbHandler.collection(cursorColl).updateOne(query, { $set: updateData }, options);
    } catch (e: any) {
      logger.error(`Update profile cursor failed, message:${e}`);
    }
  }

  const updateProfileCursorAndTime = async (id: string, cursor: string, timeStamp: number): Promise<void> => {
    try {
      const query = { _id: id };
      const updateData = { publicationCursor: cursor, lastUpdateTimeStamp: timeStamp };
      const options = { upsert: true };
      await db.dbHandler.collection(profileColl).updateOne(query, { $set: updateData }, options);
    } catch (e: any) {
      logger.error(`Update profile cursor and lastUpdateTimeStamp failed, message:${e}`);
    }
  }

  const updatePublicationCursor = async (id: string, cursor: string): Promise<void> => {
    try {
      const query = { _id: id };
      const updateData = { publicationCursor: cursor };
      const options = { upsert: true };
      await db.dbHandler.collection(profileColl).updateOne(query, { $set: updateData }, options);
    } catch (e: any) {
      logger.error(`Update publication cursor failed, message:${e}`);
    }
  }

  const updateLastUpdateById = async (id: string, timeStamp: number): Promise<void> => {
    try {
      const query = { _id: id };
      const updateData = { lastUpdateTimeStamp: timeStamp };
      const options = { upsert: true };
      await db.dbHandler.collection(profileColl).updateOne(query, { $set: updateData }, options);
    } catch (e: any) {
      logger.error(`Update lastUpdateTimeStamp by profile id failed, message:${e}`);
    }
  }

  const updateLastUpdateTimeStamp = async (timeStamp: number) => {
    try {
      const query = { _id: 'timeStamp' };
      const updateData = { lastUpdateTimeStamp: timeStamp };
      const options = { upsert: true };
      await db.dbHandler.collection(cursorColl).updateOne(query, { $set: updateData }, options);
    } catch (e: any) {
      logger.error(`Update lastUpdateTimeStamp failed, message:${e}`);
    }
  }

  const getProfileCursor = async (): Promise<string> => {
    try {
      const cursor = await db.dbHandler.collection(cursorColl).findOne({
        _id: 'profile',
      });
      if (cursor == null) {
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
      const cursor = await db.dbHandler.collection(profileColl).findOne({
        _id: id,
      });
      if (cursor == null) {
        return '{}';
      } else {
        return cursor.publicationCursor;
      }
    } catch (e: any) {
      logger.error(`Get publication cursor failed, message:${e}`);
      return '{}';
    }
  }

  const getProfileIds = async (): Promise<any> => {
    try {
      const ts = await db.dbHandler.collection(cursorColl).findOne({_id:'timeStamp'});
      if (ts === null)
        return await getAllProfileIds();

      const lastUpdateTimeStamp = ts.lastUpdateTimeStamp;
      const res = await db.dbHandler.collection(profileColl).find(
        {
          $or: [
            {lastUpdateTimeStamp: {$exists: false}},
            {lastUpdateTimeStamp: {$lt: lastUpdateTimeStamp}}
          ]
        },
        {
          projection: {_id: 1}
        },
      )
      return res;
      /*
      const res = await db.dbHandler.collection(profileColl).aggregate([
        {
          $match: {$or: [{lastUpdateTimeStamp: {$lt: lastUpdateTimeStamp}},{lastUpdateTimeStamp: {$exists:false}}]},
        },
        {
          $group: {"_id": 0, "id": {$addToSet: "$_id"}},
        },
        {
          $project: {"_id": 0, "id": 1},
        }
      ]);
      const resArray = await res.toArray();
      if (resArray.length === 0)
        return await getAllProfileIds();

      return resArray[0].id
      */
    } catch (e: any) {
      logger.error(`Get not null publication cursor failed, message:${e}`);
      return [];
    }
  }

  const getAllProfileIds = async (): Promise<any> => {
    try {
      return await db.dbHandler.collection(profileColl).find({__typename: 'Profile'}).project({_id:1});
    } catch (e: any) {
      logger.error(`Get all profile id failed, message:${e}`);
      return [];
    }
  }

  const getLensStats = async (): Promise<any> => {
  }

  return {
    insertOne,
    insertMany,
    deleteOne,
    deleteMany,
    deleteCursor,
    updateProfileCursor,
    updateProfileCursorAndTime,
    updatePublicationCursor,
    updateLastUpdateById,
    updateLastUpdateTimeStamp,
    getProfileCursor,
    getPublicationCursor,
    getProfileIds,
    getAllProfileIds,
  }
}
