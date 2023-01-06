import { createHttpTerminator } from 'http-terminator';
import { PORT } from '../config';
import { AppContext } from '../types/context.d';
import { DbOperator } from '../types/database.d';
import { BaseResponse } from '../types/api.d';
import { createDBOperator } from '../db/operator';
import * as api from '../requests';

const http = require('http');

export async function startAPI(context: AppContext) {
  const dbOperator = createDBOperator(context.database);
  const logger = context.logger;
  const server = http.createServer();
  const httpTerminator = createHttpTerminator({server});

  server.on('request', async(req: any, res: any) => {
    let url = new URL(req.url, `http://${req.headers.host}`)
    let resCode = 200
    let resBody: any = {};
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
      if ('/stats' === route) {
        resBody = await dbOperator.getStatus();
        resCode = 200;
      } else {
        resBody = {
          statusCode: 404,
          message: `Unknown request:${url.pathname}`,
        }
        resCode = resBody.statusCode;
      }
    } else if (req.method === 'POST') {
      // Do POST request
      if ('/stop' === route) {
        resBody = await api.stopTasks(dbOperator);
        resCode = resBody.statusCode;
      } else if ('/whitelist/add' === route) {
        const profileId = url.searchParams.get('address') || '';
        resBody = await api.addWhitelist(dbOperator, profileId);
        resCode = resBody.statusCode;
      } else if ('/profile/add' === route) {
        const profileId = url.searchParams.get('id') || '';
        resBody = await api.addProfile(dbOperator, profileId);
        resCode = resBody.statusCode;
      } else {
        resBody = {
          statusCode: 404,
          message: `Unknown request:${url.pathname}`,
        }
        resCode = resBody.statusCode;
      }
    } else {
      // Other type request
    }
    res.writeHead(resCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(resBody));

    // Check stop
    if (await dbOperator.getStop()) {
      logger.info('Stop api.');
      await httpTerminator.terminate();
    }
  });
  server.listen(PORT, '0.0.0.0');
  logger.info(`Start api on port:${PORT} successfully`)
}
