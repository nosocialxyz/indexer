import { apolloClient } from '../apollo-client';
import {
  ExploreProfilesDocument,
  ExploreProfilesRequest,
  ProfileSortCriteria 
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
  return res.data.exploreProfiles;
};
