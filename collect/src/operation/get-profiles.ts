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
