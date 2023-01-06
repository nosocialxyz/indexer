import { getProfiles } from '../operation';
import { LENS_DATA_LIMIT } from '../config';
import { BaseResponse } from '../types/api.d';
import { DbOperator } from '../types/database.d';
import { getProfilesByAddress } from '../operation';

export async function addWhitelist(dbOperator: DbOperator, address: string) {
  try {
    if (address === '')
      throw 'address cannot be empty!';

    const res = await dbOperator.insertWhitelist({_id:address});
    return { statusCode: 200, message: `Add whitelist:${address} successfully.`};
  } catch (e: any) {
    return { statusCode: 500, message: `Internal error,${e}`};
  }
}

export async function stopTasks(dbOperator: DbOperator): Promise<BaseResponse> {
  try {
    await dbOperator.setStop();
    return {
      statusCode: 200,
      message: 'Set '
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      message: `Internal error,${e}`,
    };
  }
}

export async function addProfile(dbOperator: DbOperator, profileId: string): Promise<BaseResponse> {
  try {
    if (profileId === '')
      throw 'Profile id cannot be empty!';

    const res = await getProfiles({
      profileIds: [profileId],
      limit: LENS_DATA_LIMIT,
    })
    if (res.items.length > 0) {
      await dbOperator.insertProfiles(res.items)
      return { statusCode: 200, message: `Add profile:${profileId} successfully.`};
    }
    return { statusCode: 404, message: `Cannot get profile:${profileId}.`};
  } catch (e: any) {
    return { statusCode: 500, message: `Internal error,${e}`};
  }
}
