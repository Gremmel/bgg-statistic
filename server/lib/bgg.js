/* eslint-disable no-undef */
'use strict';

const bggClient = require('bgg-xml-api-client').bggXmlApiClient;
const path = require('path');

// import bggXmlApiClient from 'bgg-xml-api-client';
const logger = require('./logger');
const fs = require('fs-extra');
const { subDays, format } = require('date-fns');

const bgg = {
  user: 'gismo42',
  playData: [],
  collectionData: {},
  calcData: {},

  async wait (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  },

  async init () {
    return new Promise(async (resolve, reject) => {
      try {
        await this.loadPlayData();
        logger.info('playData lenght', this.playData.length);

        await this.loadCollectionData();

        await this.calcPlayList();

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  async calcPlayList () {
    const games = {};
    const players = {};

    if (this.playData && this.playData) {
      for (const play of this.playData) {
        if (!(play.item.objectid in games)) {
          games[play.item.objectid] = play.item;
        }

        if (Array.isArray(play.players.player)) {
          for (const player of play.players.player) {
            if (!(player.name.toLowerCase() in players)) {
              players[player.name.toLowerCase()] = {
                name: player.name,
                id: player.userid
              };
            }
          }
        }
      }
    }

    this.calcData.games = games;
    this.calcData.players = players;

    await fs.writeJSON(path.join(__extdir, 'calc.json'), this.calcData, { spaces: 2 });
  },

  async writePlayDataToFile () {
    return new Promise(async (resolve, reject) => {
      try {
        // liste laden und alles aktuallisieren was neu ist
        const playsOld = await fs.readJSON(path.join(__extdir, 'plays.json'));

        for (const play of this.playData) {
          let found = false;

          for (let index = 0; index < playsOld.length; index++) {
            const playOld = playsOld[index];

            if (play.id === playOld.id) {
              logger.info('refresh play', play.item.name);
              playsOld[index] = play;
              found = true;
            }
          }

          if (!found) {
            logger.info('new play', play.item.name);
            playsOld.push(play);
          }
        }

        // eslint-disable-next-line no-undef
        await fs.writeJSON(path.join(__extdir, 'plays.json'), playsOld, { spaces: 2 });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  async writeCollectionDataToFile () {
    return new Promise(async (resolve, reject) => {
      try {
        // vor dem speichern die statistiken übernehmen
        const coll = await fs.readJSON(path.join(__extdir, 'collection.json'));

        for (const item of this.collectionData.item) {
          // entsprechendes item in vorhandenem entnehmen und statistic übernehmen
          for (const itemOld of coll.item) {
            if (item.objectid === itemOld.objectid) {
              if (itemOld.statistics) {
                item.statistics = itemOld.statistics;
              }
            }
          }
        }

        // eslint-disable-next-line no-undef
        await fs.writeJSON(path.join(__extdir, 'collection.json'), this.collectionData, { spaces: 2 });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  async loadPlayData () {
    return new Promise(async (resolve, reject) => {
      try {
        // eslint-disable-next-line no-undef
        this.playData = await fs.readJSON(path.join(__extdir, 'plays.json'));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  async loadCollectionData () {
    return new Promise(async (resolve, reject) => {
      try {
        // eslint-disable-next-line no-undef
        this.collectionData = await fs.readJSON(path.join(__extdir, 'collection.json'));
        resolve();
      } catch (error) {
        if (error.code === 'ENOENT') {
          try {
            await this.getCollectionData();
          } catch (error2) {
            reject(error2);
          }
        } else {
          logger.error(error);
        }
      }
    });
  },

  async getPlayData (all, statusFuc) {
    return new Promise(async (resolve, reject) => {
      try {
        // const { data } = await bggClient.get('user', { name: this.user });
        // solange abfragen bis keine einträge mehr kommen
        let page = 1;
        let next = true;
        let mindate = '';

        if (!all) {
          mindate = format(subDays(new Date(), 2), 'yyyy-MM-dd');
        }

        logger.info('mindate', mindate);

        this.playData.splice(0);

        while (next) {
          logger.info('read page', page);
          const { data } = await bggClient.get('plays', { username: this.user, page, mindate });

          if (data && data.play) {
            this.playData = this.playData.concat(data.play);
          } else {
            next = false;
          }
          if (statusFuc) {
            statusFuc(this.playData.length, data.total);
          }

          if (page > 50) {
            next = false;
          }

          page += 1;
        }

        await this.writePlayDataToFile();

        resolve(this.playData);
      } catch (error) {
        reject(error);
      }
    });
  },

  async getCollectionData () {
    return new Promise(async (resolve, reject) => {
      try {
        logger.info('getCollction Data from BGG');

        // const { data } = await bggClient.get('user', { name: this.user });
        const { data } = await bggClient.get('collection', { username: this.user }, 10);

        this.collectionData = data;

        await this.writeCollectionDataToFile();

        logger.info('getCollction Data from BGG finished');
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  },

  async getGameData (gameId) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await bggClient.get('thing', { id: gameId, stats: true });

        resolve(res.data);
      } catch (error) {
        reject(error);
      }
    });
  }

};

module.exports = bgg;
