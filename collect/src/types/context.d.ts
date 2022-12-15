import { MongoDB } from '../db';

export interface AppContext {
  database: MongoDB;
}
