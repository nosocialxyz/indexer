import { MongoDB } from '../db';
import { Logger } from 'winston';

export interface AppContext {
  database: MongoDB;
  logger: Logger;
  deleteOld?: boolean;
}
