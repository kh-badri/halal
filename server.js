/**
 * Road To Halal Production Server Entry for cPanel CloudLinux / Phusion Passenger
 * Zero-Setup / Standalone Runtime
 */
const path = require('path');
const fs = require('fs');

const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');

if (fs.existsSync(standaloneServer)) {
  require(standaloneServer);
} else {
  console.error('> Error: .next/standalone/server.js not found.');
  process.exit(1);
}



