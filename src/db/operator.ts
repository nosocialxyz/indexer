import { Database } from 'sqlite';
import { logger } from '../utils/logger';
import { formatError } from '../utils';
import { TRYOUT } from '../consts';
import {
  FileStatus,
  Record,
  RecordShow,
  ElrondTimestamp,
  DbOperator,
} from '../types/database';

export function createRecordOperator(db: Database): DbOperator {
  const addRecord = async (
    customer: string,
    merchant: string,
    cid: string,
    size: number,
    token: string,
    price: string,
    blockNumber: number,
    chainType: string,
    txHash: string,
    timestamp: number,
  ): Promise<void> => {
    try {
      await db.run(
        'insert into record ' +
          '(`customer`, `merchant`, `cid`, `size`, `token`, `price`, `blockNumber`, `chainType`, `txHash`, `timestamp`, `tryout`, `status`)' +
          ' values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          customer,
          merchant,
          cid,
          size,
          token,
          price,
          blockNumber,
          chainType,
          txHash,
          timestamp,
          0,
          'new',
        ],
      );
      logger.info(`Add ${chainType} task successfully.`);
      logger.info(`  customer:${customer}`);
      logger.info(`  merchant:${merchant}`);
      logger.info(`  cid:${cid}`);
      logger.info(`  size:${size}`);
      logger.info(`  price:${price}`);
      logger.info(`  token:${token}`);
    } catch(e) {
      const err_code = JSON.parse(JSON.stringify(e)).code;
      if (err_code !== 'SQLITE_CONSTRAINT') {
        throw e;
      }
    }
  };

  const getRecordByType = async (
    status: string,
    chainType: string,
  ): Promise<RecordShow[]> => {
    let params: string[] = []; 
    status === '' || params.push(`status = '${status}'`);
    chainType === '' || params.push(`chainType = '${chainType}'`);
    let where = "";
    if (params.length > 0) {
      where = `where ${params.join(' and ')}`;
    }
    const records = await db.all(
      `select customer, merchant, cid, size, token, price, blockNumber, chainType, txHash, timestamp, status from record ${where} order by timestamp asc`,
      [],
    );
    return records;
  };

  const getNewRecord = async (): Promise<Record[]> => {
    const records = await db.all(
      'select id, cid, size, blockNumber, txHash, status from record where status = ? and tryout < ? order by timestamp asc',
      ["new", TRYOUT],
    );
    return records;
  };

  const getOrderedRecord = async (): Promise<Record[]> => {
    const records = await db.all(
      'select id, cid, size, blockNumber, txHash, status from record where status = ? and tryout < ? order by timestamp asc',
      ["ordered", TRYOUT],
    );
    return records;
  };

  const getElrondLatestTimestamp = async (): Promise<number> => {
    const records = await db.all(
      'select id, blockNumber from record where chainType = ? order by blockNumber desc',
      ["elrond"],
    );
    if (records.length > 0) {
      return records[0].blockNumber;
    }
    return 0;
  };

  const getXStorageLatestBlkNum = async (): Promise<number> => {
    const records = await db.all(
      'select id, blockNumber from record where chainType = ? order by blockNumber desc',
      ["xstorage"],
    );
    if (records.length > 0) {
      return records[0].blockNumber;
    }
    return 0;
  };

  const updateStatus = async (
    id: number,
    status: FileStatus,
  ): Promise<void> => {
    await db.run(
      `update record set status = ? where id = ? `,
      [status, id],
    );
  };

  const increaseTryout = async (id: number, step = 1): Promise<void> => {
    await db.run(
      `update record set tryout = tryout + ?, status = CASE WHEN tryout + ? >= ? THEN 'tryout' ELSE 'new' END where id = ?`,
      [step, step, TRYOUT, id],
    )
  }

  return {
    addRecord,
    getRecordByType,
    getNewRecord,
    getOrderedRecord,
    getElrondLatestTimestamp,
    getXStorageLatestBlkNum,
    updateStatus,
    increaseTryout,
  };
}
