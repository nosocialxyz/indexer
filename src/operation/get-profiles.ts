import { apolloClient } from '../apollo-client';
import {
  ExploreProfilesDocument,
  ExploreProfilesRequest,
  ProfileSortCriteria 
} from '../graphql/generated';
import { loadDB, closeAllDB } from '../db';
import { getDbOperatorByName } from '../db/operator';
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

/*
export const getProfiles = async () => {
  try {
    const dbOperator = await getDbOperatorByName('test');
    const collName = "profile";
    const step = 1;
    let cursor = await dbOperator.getProfileCursor();
    for (let i = 0; i < 10; i++) {
      const res = await exploreProfiles({
        sortCriteria: ProfileSortCriteria.MostFollowers,
        cursor: cursor,
        limit: step
      })
      cursor = res.pageInfo.next;
      await dbOperator.insertMany(collName, res.items);
    }
    await dbOperator.updateProfileCursor(cursor);
  } catch(e: any) {
    logger.error(e);
    return;
  }
}

(async () => {
  await getProfiles();
  await closeAllDB();
})();
*/
