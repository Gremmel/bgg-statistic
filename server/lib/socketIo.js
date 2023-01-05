'use strict';

const socket = require('socket.io');
const logger = require('./logger');
const fs = require('fs-extra');
const path = require('path');
const middleware = require('socketio-wildcard')();

const socketIo = {
  // http server
  server: undefined,
  io: undefined,
  clients: {},
  vueControllers: {},

  async requireViewController (bgg) {
    const controllerList = await fs.readdir(path.join(__dirname, 'vueController'));

    for (const controller of controllerList) {
      logger.info('require vueController', controller);
      // eslint-disable-next-line global-require
      this.vueControllers[controller] = require(path.join(__dirname, 'vueController', controller));

      if (this.vueControllers[controller].setBgg) {
        this.vueControllers[controller].setBgg(bgg);
      }
    }
  },

  init (server, bgg) {
    this.server = server;

    this.io = socket(this.server, {
      cors: {
        origin: '*',
        methods: [ 'GET', 'POST' ]
      }
    });

    this.io.use(middleware);

    // controller requiren
    this.requireViewController(bgg);

    this.io.on('connection', (client) => {
      this.clients[client.id] = client;

      logger.info('io connection', client.id);

      client.on('*', (paket) => {
        if (this.vueControllers[paket.data[0] + '.js']) {
          if (paket.data[1].callFunction && this.vueControllers[paket.data[0] + '.js'][paket.data[1].callFunction]) {
            this.vueControllers[paket.data[0] + '.js'][paket.data[1].callFunction](client, paket.data[1].payload);
          } else {
            logger.error(`Funktion >${paket.data[1].callFunction}< in Modul >${paket.data[0]}.js< ist nicht vorhanden`);
          }
        } else {
          logger.error(`Modul ${paket.data[0]}.js ist nicht vorhanden`, paket);
        }
      });

      client.on('disconnect', () => {
        delete this.clients[client.id];
        logger.info('client disconnect', client.id);
      });
    });
  }
};

module.exports = socketIo;
