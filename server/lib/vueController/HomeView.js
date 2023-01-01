'use strict';

const logger = require('../logger');

const HomeView = {
  start () {
    logger.info('start in HomeView');
  },

  init (ioClient, payload) {
    logger.debug('init', payload);
    ioClient.emit('initHome', {
      msg: 'Hallo vom Server'
    });
  }

};

HomeView.start();

module.exports = HomeView;
