import { Logger } from "winston";

export interface AppContext {
  logger: Logger;
  timestamp: number;
  deleteOld?: boolean;
}
