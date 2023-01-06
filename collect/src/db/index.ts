import Bluebird from 'bluebird';
import { MongoClient } from "mongodb";
import { mongoServURI } from "../config";
import { logger } from "../utils/logger";

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
  await Bluebird.delay(3 * 1000);
  for (const db of dbPools.values()) {
    await db.disconnect();
  }
}

export class MongoDB {
  public client: any;
  public dbHandler: any;
  private dbName: string;

  public constructor(dbName: string) {
    this.dbName = dbName;
  }

  async connect(): Promise<boolean> {
    try {
      // Create a new MongoClient
      this.client = new MongoClient(mongoServURI);
      // Connect the client to the server (optional starting in v4.7)
      await this.client.connect();
      // Establish and verify connection
      await this.client.db(this.dbName).command({ ping: 1 });
      this.dbHandler = this.client.db(this.dbName);
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
}
