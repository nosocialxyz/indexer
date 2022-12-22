export interface DbOperator {
  insertOne: (collName: string, data: any) => Promise<void>;
  insertMany: (collName: string, data: any) => Promise<void>;
  insertProfiles: (data: any) => Promise<any>;
  insertPublications: (data: any) => Promise<void>;
  deleteOne: (collName: string, query: any) => Promise<void>;
  deleteMany: (collName: string, query: any) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  updateProfileCursor: (cursor: any, status?: string) => Promise<void>;
  updatePublicationCursor: (id: string, cursor: string) => Promise<void>;
  isUpdateFinished: () => Promise<boolean>;
  setSyncedBlockNumber: (blockNumber: number) => Promise<void>;
  setStartBlockNumber: () => Promise<void>;
  getProfileCursor: () => Promise<string>;
  getPublicationCursor: (id: string) => Promise<string>;
  getProfileIds: () => Promise<any>;
  getSyncedBlockNumber: () => Promise<number>;
  getStartBlockNumber: () => Promise<number>;
}
