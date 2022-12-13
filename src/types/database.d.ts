export interface DbOperator {
  insertOne: (collName: string, data: any) => Promise<void>;
  insertMany: (collName: string, data: any) => Promise<void>;
  deleteOne: (collName: string, query: any) => Promise<void>;
  deleteMany: (collName: string, query: any) => Promise<void>;
  deleteCursor: (query: any) => Promise<void>;
  updateProfileCursor: (cursor: any) => Promise<void>;
  updatePublicationCursor: (id: string, cursor: any) => Promise<void>;
  getProfileCursor: () => Promise<string>;
  getPublicationCursor: (id: string) => Promise<string>;
  getNotNullPubCursor: () => Promise<string[]>;
  getProfileIds: () => Promise<string[]>;
}
