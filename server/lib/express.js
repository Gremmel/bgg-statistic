'use strict';

const exp = require('express');
const http = require('http');
const path = require('path');
const logger = require('./logger');

const express = {
  app: exp(),
  server: undefined,
  port: 3000,

  init () {
    // static path auf ui
    this.app.use('/', exp.static(path.join(__dirname, '..', '..', 'ui', 'dist')));

    this.server = http.createServer(this.app);
  },

  start () {
    this.server.listen(this.port, () => {
      logger.info('app listening on port ', this.port);
    });
  }
};

module.exports = express;
