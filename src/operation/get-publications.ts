import Bluebird from 'bluebird';
import { apolloClient } from '../apollo-client';
import { 
  PublicationsQueryRequest,
  PublicationsDocument,
  PublicationTypes } from '../graphql/generated';
import { logger } from '../utils/logger';
import { getDbOperatorByName } from '../db/operator';
import os from 'os';

const maxTaskNum = os.cpus().length;

export async function queryPublications(request: PublicationsQueryRequest) {
  const res = await apolloClient.query({
    query: PublicationsDocument,
    variables: {
      request,
    },
  });
  return res.data;
};

/*
const getPublication = async (id: string) => {
  try {
    const collName = 'publication';
    const rowNum = 50;
    const dbOperator = await getDbOperatorByName('test');
    let cursor = await dbOperator.getPublicationCursor(id);
    while (true) {
      const res = await queryPublications({
        profileId: id,
        publicationTypes: [ 
          PublicationTypes.Post, 
          PublicationTypes.Comment, 
          PublicationTypes.Mirror,
        ],
        cursor: cursor,
        limit: rowNum,
      })
      cursor = res.publications.pageInfo.next;
      const items = res.publications.items;
      if (items.length == 0 ) {
        await dbOperator.updatePublicationCursor(id, cursor);
        break
      }
      await dbOperator.insertMany(collName, items);
    }
  } catch (e: any) {
    logger.error(e);
  }
}

export const getPublications = async () => {
  try {
    const collName = 'publication';
    const dbOperator = await getDbOperatorByName('test');
    const ids = await dbOperator.getProfileIds();
    await Bluebird.map(ids, (id: any) => getPublication(id), { concurrency : maxTaskNum })
  } catch (e: any) {
    logger.error(e);
  }
}

(async () => {
  await getPublications();
})();
*/
