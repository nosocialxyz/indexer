export interface DbOperator {
  insertOne: (collName: string, data: any) => Promise<void>;
  insertMany: (collName: string, data: any) => Promise<void>;
  insertProfile: (data: any) => Promise<any>;
  insertProfiles: (data: any) => Promise<any>;
  insertPublications: (data: any) => Promise<void>;
  deleteOne: (collName: string, query: any) => Promise<void>;
  deleteMany: (collName: string, query: any) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  updateProfileCursor: (cursor: any, status?: string) => Promise<void>;
  updatePublicationCursor: (id: string, cursor: string) => Promise<void>;
  incTask: () => Promise<void>;
  decTask: () => Promise<void>;
  getTask: () => Promise<number>;
  isUpdateFinished: () => Promise<boolean>;
  setTask: (n: number) => Promise<void>;
  setSyncedBlockNumber: (blockNumber: number) => Promise<void>;
  setStartBlockNumber: () => Promise<void>;
  setStop: (stop: boolean) => Promise<void>;
  getProfileCursor: () => Promise<string>;
  getPublicationCursor: (id: string) => Promise<string>;
  getProfileIds: () => Promise<any>;
  getSyncedBlockNumber: () => Promise<number>;
  getStartBlockNumber: () => Promise<number>;
  getStatus: () => Promise<any>;
  getWhiteList: () => Promise<string[]>;
  getStop: () => Promise<boolean>;
}
