/**
 * Road To Halal Production Server Entry for cPanel CloudLinux / Phusion Passenger
 */
const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');

const rawPort = process.env.PORT || 3000;
const isNumeric = /^\d+$/.test(String(rawPort));
const port = isNumeric ? parseInt(String(rawPort), 10) : rawPort;
const hostname = process.env.HOSTNAME || '0.0.0.0';

// If explicitly requested standalone and numeric port
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');
if (process.env.RUN_STANDALONE === 'true' && fs.existsSync(standaloneServerPath) && isNumeric) {
  require(standaloneServerPath);
} else {
  const next = require('next');
  const app = next({ dev: process.env.NODE_ENV !== 'production' });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    if (isNumeric) {
      server.listen(port, hostname, (err) => {
        if (err) throw err;
        console.log(`> Road To Halal Server ready on http://${hostname}:${port}`);
      });
    } else {
      // Phusion Passenger UNIX domain socket
      server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Road To Halal Server ready on Passenger socket: ${port}`);
      });
    }
  }).catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });
}

