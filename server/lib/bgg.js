'use strict';

const bggClient = require('bgg-xml-api-client').bggXmlApiClient;
const path = require('path');
// import bggXmlApiClient from 'bgg-xml-api-client';
const logger = require('./logger');
const fs = require('fs-extra');

const bgg = {
  user: 'gismo42',
  playData: {},
  collectionData: {},
  calcData: {},

  async init () {
    return new Promise(async (resolve, reject) => {
      try {
        await this.loadPlayData();
        this.calcPlayList();
        await this.writePlayDataToFile()

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  calcPlayList () {
    const games = {};
    const players = {};

    if (this.playData && this.playData.play) {
      for (const play of this.playData.play) {
        if (!(play.item.objectid in games)) {
          games[play.item.objectid] = play.item
        }

        if (Array.isArray(play.players.player)) {
          for (const player of play.players.player) {
            if(!(player.name.toLowerCase() in players)) {
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
  },

  async writePlayDataToFile () {
    return new Promise(async (resolve, reject) => {
      try {
        await fs.writeJSON(path.join(__extdir, 'calc.json'), this.calcData, { spaces: 2 });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  async writeCollectionDataToFile () {
    return new Promise(async (resolve, reject) => {
      try {
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
        this.playData = await fs.readJSON(path.join(__extdir, 'plays.json'));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  async getPlayData () {
    return new Promise(async (resolve, reject) => {
      try {
        // const { data } = await bggClient.get('user', { name: this.user });
        const { data } = await bggClient.get('plays', { username: this.user }, 2);

        this.playData = data

        await this.writePlayDataToFile();

        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  },

  async getCollectionData () {
    return new Promise(async (resolve, reject) => {
      try {
        // const { data } = await bggClient.get('user', { name: this.user });
        const { data } = await bggClient.get('collection', { username: this.user }, 2);

        this.collectionData = data;

        await this.writeCollectionDataToFile();

        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  }

};


module.exports = bgg;
