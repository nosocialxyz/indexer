import sqlite3 = require('sqlite3');
import { Database, open } from 'sqlite';
import { DB_PATH } from '../config';
import { createRecordTable } from './init-schema';
import path from 'path';
import { Sequelize } from 'sequelize';

export async function loadDb(): Promise<Database> {
  const dbPath = path.join(DB_PATH, 'pinning-db.sqlite');
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
  });

  await createRecordTable(sequelize.getQueryInterface());
  await sequelize.close();

  console.info('initialize db connection...', { scope: 'db' });
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  return db;
}
