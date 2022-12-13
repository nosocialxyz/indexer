import { MongoClient } from "mongodb";
import { mongoServURI } from "../config";
import { logger } from "../utils/logger";
import { sleep } from '../utils';

const dbPools = new Map<string,MongoDB>();

export async function loadDB(dbName: string): Promise<MongoDB|null> {
  if (dbPools.has(dbName)) {
    const db = dbPools.get(dbName);
    if (db != undefined)
      return db;

    dbPools.delete(dbName);
  }

  const db = new MongoDB(dbName);
  const res = await db.connect();
  if (!res)
    throw `Load db:${dbName} failed`;

  dbPools.set(dbName, db);
  return db;
}

export async function closeAllDB() {
  await sleep(3000);
  for (const db of dbPools.values()) {
    await db.disconnect();
  }
}

export class MongoDB {
  private client: any;
  private dbName: string;

  public constructor(dbName: string) {
    this.dbName = dbName;
  }

  // Connection URI
  //const uri =
  //  "http://localhost:27017";
    //"http://localhost:27017/?maxPoolSize=20&w=majority";

  async connect(): Promise<boolean> {
    try {
      // Create a new MongoClient
      this.client = new MongoClient(mongoServURI);
      // Connect the client to the server (optional starting in v4.7)
      await this.client.connect();
      // Establish and verify connection
      await this.client.db(this.dbName).command({ ping: 1 });
      logger.info("Connected successfully to server");
    } catch (e: any) {
      logger.error(e);
      return false;
    } finally {
      // Ensures that the client will close when you finish/error
      //await this.client.close();
    }
    return true;
  }

  async disconnect() {
    await this.client.close();
  }

  async insertOne(collection: string, data: any) {
    try {
      await this.client.db(this.dbName).collection(collection).insertOne(data);
    } catch (e: any) {
      if (e.code !== 11000)
        logger.error(`Insert data failed, message:${e}`);
    }
  }

  async insertMany(collection: string, data: any) {
    try {
      await this.client.db(this.dbName).collection(collection).insertMany(data);
    } catch (e: any) {
      if (e.code !== 11000)
        logger.error(`Insert many data failed, message:${e}`);
    }
  }

  async deleteOne(collection: string, query: any) {
    try {
      await this.client.db(this.dbName).collection(collection).deleteOne(query);
    } catch (e: any) {
      logger.error(`Delete one data failed, message:${e}`);
    }
  }

  async deleteMany(collection: string, query: any) {
    try {
      await this.client.db(this.dbName).collection(collection).deleteMany(query);
    } catch (e: any) {
      logger.error(`Delete many data failed, message:${e}`);
    }
  }

  async findOne(collection: string, query: any) {
    try {
      return await this.client.db(this.dbName).collection(collection).findOne(query);
    } catch (e: any) {
      logger.error(`find one data failed, message:${e}`);
    }
    return null;
  }

  async findMany(collection: string, query: any) {
    try {
      return await this.client.db(this.dbName).collection(collection).find(query);
    } catch (e: any) {
      logger.error(`find many data failed, message:${e}`);
    }
  }

  async aggregate(collection: string, query: any, options?: any) {
    try {
      return await this.client.db(this.dbName).collection(collection).aggregate(query,options);
    } catch (e: any) {
      logger.error(`find many data failed, message:${e}`);
    }
  }

  async updateOne(collection: string, query: any, updateData: any, options?: any) {
    try {
      await this.client.db(this.dbName).collection(collection).updateOne(query, { $set: updateData }, options);
    } catch (e: any) {
      logger.error(`Update one data failed, message:${e}`);
    }
  }
}
