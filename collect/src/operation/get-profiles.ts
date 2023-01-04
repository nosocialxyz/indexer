import Bluebird from 'bluebird';
import { apolloClient } from '../apollo-client';
import {
  ExploreProfilesDocument,
  ExploreProfilesRequest,
  ProfileSortCriteria,
  ProfileQueryRequest,
  ProfilesDocument,
} from '../graphql/generated';
import { loadDB, closeAllDB } from '../db';
import { logger } from '../utils/logger';
import { LENS_DATA_LIMIT } from '../config';

export async function exploreProfiles(request: ExploreProfilesRequest) {
  const res = await apolloClient.query({
    query: ExploreProfilesDocument,
    variables: {
      request,
    },
  });
  const data = res.data.exploreProfiles;
  if (data === null || data === undefined)
    throw ({
      statusCode: 404,
      message: 'Explore profiles failed!',
    });

  return data;
}

export async function getProfiles(request: ProfileQueryRequest) {
  const res = await apolloClient.query({
    query: ProfilesDocument,
    variables: {
      request,
    },
  });
  const data = res.data.profiles;
  if (data === null || data === undefined)
    throw ({
      statusCode: 404,
      message: 'Get profiles failed!',
    });

  return data;
}

export async function getProfilesByAddress(address: string): Promise<string[]> {
  let cursor = '{}';
  const res: any[] = [];
  while (true) {
    try {
      const profiles = await getProfiles({
        ownedBy: [address],
        limit: LENS_DATA_LIMIT,
        cursor: cursor,
      })
      if (profiles.items.length > 0) {
        for (const profile of profiles.items) {
          res.push({_id:profile._id, address:address});
        }
      }

      if (profiles.items.length < LENS_DATA_LIMIT)
        break;

      cursor = profiles.pageInfo.next;
    } catch (e: any) {
      logger.error(`Get profile by address:${address} failed, error:${e}`);
      if (e.networkError.statusCode === 429)
        await Bluebird.delay(5 * 60 * 1000);
    }
  }
  return res;
}
