import { PORT } from './config'

const http = require('http');

async function main() {

  // Create a local server to receive data from
  const server = http.createServer();

  // Listen to the request event
  server.on('request', async (req: any, res: any) => {
    let url = new URL(req.url, `http://${req.headers.host}`)
    let resCode = 200
    let resBody = {}
    let resMsg = ''
    console.log(`Http request:${url.pathname}`)
    const restfulHeader = '/api/v0'
    const reqHeader = url.pathname.substr(0, restfulHeader.length)
    if (reqHeader !== restfulHeader) {
      resBody = {
        statusCode: 404,
        message: `Unknown request:${url.pathname}`
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resBody));
      return
    }
    const route = url.pathname.substr(restfulHeader.length)
    if (req.method === 'POST') {
      if ('/order' === route) {
        const cid = url.searchParams.get('cid')
        let size = url.searchParams.get('size')
        if (cid === null) {
          resMsg = "illegal parameter, cid should not be null"
          resCode = 400
        } else if (size === null) {
          resMsg = "illegal parameter, size should not be null"
          resCode = 400
        } else {
          /*
          resMsg = `Place order:${cid} successfully, size:${size}.`
          resCode = 200
          */
          console.log(`order cid:${cid}, size:${size}`)
          const fsize = parseInt(size)
          const orderRes = await chain.order(cid, fsize)
          if (!orderRes) {
            resMsg = `Order cid(${cid}) failed`
            resCode = 400
          } else {
            resMsg = `Order cid(${cid}), size(${fsize}) success`
          }
        }
      } else {
        resMsg = `unknown request:${url.pathname}`
        resCode = 404
      }
    } else {
      if ('/replica' === route) {
        const cid = url.searchParams.get('cid')
        if (cid !== null) {
          try {
            const replica = await checkReplica(cid)
            resBody = {
              cid: cid,
              replica: replica
            }
          } catch(e: any) {
            resMsg = `Get file:'${cid}' replica failed`
            resCode = 500
          }
        } else {
          resMsg = 'illegal parameter, need parameter:cid'
          resCode = 500
        }
      } else {
        resMsg = `unknown request:${url.pathname}`
        resCode = 404
      }
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

  server.listen(PORT, '0.0.0.0', () => {
  });
}

main().then(() => {
  console.log(`Start server on port:${PORT} successfully`)
}).catch((e: any) => {
  console.error("Start server failed.")
})
