export interface DbOperator {
  insertOne: (collName: string, data: any) => Promise<void>;
  insertMany: (collName: string, data: any) => Promise<void>;
  deleteOne: (collName: string, query: any) => Promise<void>;
  deleteMany: (collName: string, query: any) => Promise<void>;
  deleteCursor: (query: any) => Promise<void>;
  updateProfileCursor: (cursor: any) => Promise<void>;
  updateProfileCursorAndTime: (id: string, cursor: string, timeStamp: number) => Promise<void>;
  updatePublicationCursor: (id: string, cursor: string) => Promise<void>;
  updateLastUpdateById: (id: string, timeStamp: number) => Promise<void>;
  updateLastUpdateTimeStamp: (timeStamp: number) => Promise<void>;
  getProfileCursor: () => Promise<string>;
  getPublicationCursor: (id: string) => Promise<string>;
  getProfileIds: () => Promise<any>;
  getAllProfileIds: () => Promise<any>;
}
