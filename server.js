/**
 * Road To Halal Production Server Entry for cPanel CloudLinux / Phusion Passenger
 */
const http = require('http');
const path = require('path');
const fs = require('fs');

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || '0.0.0.0';

// Check if running from standalone output
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');

if (fs.existsSync(standaloneServerPath) && process.env.RUN_STANDALONE !== 'false') {
  // Let Next.js standalone handle it
  require(standaloneServerPath);
} else {
  // Fallback to standard Next.js custom server
  const next = require('next');
  const app = next({ dev: process.env.NODE_ENV !== 'production' });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    http.createServer((req, res) => {
      handle(req, res);
    }).listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`> Road To Halal Server ready on http://${hostname}:${port}`);
    });
  }).catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });
}
