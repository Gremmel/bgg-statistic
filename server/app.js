'use strict';

const path = require('path');

// eslint-disable-next-line no-underscore-dangle
global.__extdir = path.join('..', 'extern');

const express = require('./lib/express');
const socketIo = require('./lib/socketIo');
const logger = require('./lib/logger');
const bgg = require('./lib/bgg');

(async () => {
  try {
    // BGG playdata abrufen
    // await bgg.getPlayData();
    // await bgg.getCollectionData();
    // process.exit(0);

    await bgg.init();

    logger.debug('init express');

    // webserver initialisieren
    express.init();

    logger.debug('init socket IO');

    // Socket IO
    socketIo.init(express.server, bgg);

    express.start();

    // regelmäsig collection data aktuallisieren
    bgg.startRefreshZyclus();
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
})();

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

