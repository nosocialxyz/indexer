import { logger } from '../utils/logger';
import { Task } from '../types/tasks';
import { PORT } from '../config';
import { getDbOperatorByName } from '../db/operator';
import { apis } from './';

const http = require('http');

export async function createAPI(): Promise<Task> {
  return {
    name: "api",
    start: async () => {
      const server = http.createServer();

      server.on('request', async(req: any, res: any) => {
        const dbOps = await getDbOperatorByName('test')
        let url = new URL(req.url, `http://${req.headers.host}`)
        let resCode = 200
        let resBody = {}
        let resMsg = ''
        const restfulHead = '/api/v0'
        const reqHead = url.pathname.substr(0, restfulHead.length)
        if (reqHead !== restfulHead) {
          resBody = {
            statusCode: 404,
            message: `unknown request:${url.pathname}`
          }
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(resBody));
          return
        }
        const route = url.pathname.substr(restfulHead.length);
        if (req.method === 'GET') {
          // Do GET request
          if ('/lens/stats' === route) {
            const status = url.searchParams.get('status') || '';
            const chainType = url.searchParams.get('chainType') || '';
            //resBody = await dbOps.getRecordByType(status, chainType);
          } else {
            resMsg = `Unknown request:${url.pathname}`;
            resCode = 404;
          }
        } else if (req.method === 'POST') {
          // Do POST request
          if ('/get/profiles' === route) {
            apis.getProfiles();
            resMsg = 'Start get-profiles task successfully!';
          } else if ('/get/publications' === route) {
            apis.getPublications();
            resMsg = 'Start get-publications task successfully!';
          } else {
            resMsg = `Unknown request:${url.pathname}`;
            resCode = 404;
          }
        } else {
          // Other type request
        }
        if (resMsg !== '') {
          resBody = {
            statusCode: resCode,
            message: resMsg
          }
        }
        res.writeHead(resCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(resBody));
      });
      server.listen(PORT, '0.0.0.0');
      logger.info(`Start api on port:${PORT} successfully`)
    },
    stop: async () => {
      return true;
    }
  }
}
