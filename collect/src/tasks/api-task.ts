import { PORT } from '../config';
import { AppContext } from '../types/context.d';

const http = require('http');

export async function createAPI(context: AppContext) {
  const logger = context.logger;
  const server = http.createServer();

  server.on('request', async(req: any, res: any) => {
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
      } else {
        resMsg = `Unknown request:${url.pathname}`;
        resCode = 404;
      }
    } else if (req.method === 'POST') {
      // Do POST request
      if ('/get/profiles' === route) {
      } else if ('/get/publications' === route) {
      } else {
        resMsg = `Unknown request:${url.pathname}`;
        resCode = 404;
      }
    } else {
      // Other type request
    }
    res.writeHead(resCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(resBody));
  });
  server.listen(PORT, '0.0.0.0');
  logger.info(`Start api on port:${PORT} successfully`)
}
