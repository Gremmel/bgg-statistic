'use strict';

const path = require('path');

// eslint-disable-next-line no-underscore-dangle
global.__extdir = path.join('..', 'extern');

const express = require('./lib/express');
const socketIo = require('./lib/socketIo');
const logger = require('./lib/logger');
const bgg = require('./lib/bgg');

// BGG playdata abrufen
bgg.init();

// bgg.getCollectionData();

logger.debug('init express');

// webserver initialisieren
express.init();

logger.debug('init socket IO');

// Socket IO
socketIo.init(express.server);

process.on('SIGINT', async () => {
  logger.debug(' SIGINT (Ctrl+C)');
  process.exit();
});

process.on('SIGTERM', async () => {
  logger.debug('SIGTERM');
  process.exit();
});

process.on('exit', (code) => {
  logger.debug(`exit with code: ${code}`);
});

express.start();
