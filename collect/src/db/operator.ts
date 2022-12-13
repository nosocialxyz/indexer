import { logger } from '../utils/logger';
import { loadDB, MongoDB } from '../db';
import { DbOperator } from '../types/database.d';

export async function getDbOperatorByName(name: string): Promise<DbOperator> {
  const db = await loadDB(name);
  if (db == null)
    throw `Load DB:${name} failed`;

  return createDBOperator(db);
}

export function createDBOperator(db: MongoDB): DbOperator {
  const profileColl = 'profile';
  const publicationColl = 'publication';
  const cursorColl = 'cursor';

  const insertOne = async (collName: string, data: any): Promise<void> => {
    return await db.insertOne(collName, data);
  }

  const insertMany = async (collName: string, data: any): Promise<void> => {
    return await db.insertMany(collName, data);
  }

  const deleteOne = async (collName: string, query: any): Promise<void> => {
    await db.deleteOne(collName, query);
  }

  const deleteMany = async (collName: string, query: any): Promise<void> => {
    await db.deleteMany(collName, query);
  }

  const deleteCursor = async (query: any): Promise<void> => {
    await db.deleteMany(cursorColl, query);
  }

  const updateProfileCursor = async (cursor: any): Promise<void> => {
    const query = { _id: 'profile' };
    const updateData = { value: cursor };
    const options = { upsert: true };
    await db.updateOne(cursorColl, query, updateData, options);
  }

  const updatePublicationCursor = async (id: string, cursor: any): Promise<void> => {
    const query = { _id: id };
    const updateData = { value: cursor };
    const options = { upsert: true };
    await db.updateOne(cursorColl, query, updateData, options);
  }

  const getProfileCursor = async (): Promise<string> => {
    const cursor = await db.findOne(cursorColl, {
      _id: 'profile',
    });
    if (cursor == null) {
      return '{}';
    } else {
      return cursor.value;
    }
  }

  const getPublicationCursor = async (id: string): Promise<string> => {
    const cursor = await db.findOne(cursorColl, {
      _id: id,
    });
    if (cursor == null) {
      return '{}';
    } else {
      return cursor.value;
    }
  }

  /*
  const getNullPubCursor = async (): Promise<string[]> {
    const res = await db.aggregate(publicationColl, [
      {
        $match:{_id: {$ne: 'Profile'}, value: {$eq: "{}"}},
      },
      {
        $group: {"_id": 0, "value": {$addToSet: "value"}},
      },
      {
        $project: {"_id": 0, "value": 1},
      }
    ]);
    return (await res.toArray())[0].value;
  }
  */

  const getNotNullPubCursor = async (): Promise<string[]> => {
    const res = await db.aggregate(cursorColl, [
      {
        $match:{_id: {$ne: 'profile'}, value: {$ne: "{}"}},
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
      return [];

    return resArray[0].id
  }

  const getProfileIds = async (): Promise<string[]> => {
    const res = await db.aggregate(profileColl, [
      {
        $match: {__typename: 'Profile'},
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
      return [];

    return resArray[0].id
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
    updatePublicationCursor,
    getProfileCursor,
    getPublicationCursor,
    getNotNullPubCursor,
    getProfileIds,
  }
}
