'use strict';

const logger = require('../logger');

const AppHeader = {
  initFinished: false,

  start () {
    logger.info('start in AppHeader');
  },

  init (ioClient, payload) {
    logger.debug('init', payload);
    ioClient.emit('initAppHeader', {
      msg: 'Hallo Header vom Server'
    });
    this.initFinished = true;
  }

};

AppHeader.start();

module.exports = AppHeader;
