/* eslint-disable no-param-reassign */
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
        const playerList = {};

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

        // alle spieler ermitteln und überprüfen ob neue hinzugekommen sind
        for (const play of playsOld) {
          if (Array.isArray(play.players.player)) {
            for (const player of play.players.player) {
              playerList[player.name] = {
                id: player.userid
              };
            }
          }
        }

        await this.checkNewPlayer(playerList);

        // eslint-disable-next-line no-undef
        await fs.writeJSON(path.join(__extdir, 'plays.json'), playsOld, { spaces: 2 });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  async checkNewPlayer (playerList) {
    try {
      const status = await fs.readJSON(path.join(__extdir, 'status.json'));
      let newPlayer = false;

      for (const name in playerList) {
        if (Object.hasOwnProperty.call(playerList, name)) {
          const player = playerList[name];

          if (!status.players[name.toLowerCase()]) {
            logger.warn('neuer Player', name);
            status.players[name.toLowerCase()] = {
              name,
              id: player.id,
              checked: false
            };
            newPlayer = true;
          }
        }
      }

      if (newPlayer) {
        logger.info('schreibe neue Status liste da Player hinzugekommen sind');
        await fs.writeJson(path.join(__extdir, 'status.json'), status, { spaces: 2 });
      }
    } catch (error) {
      logger.error('Fehler in checkNewPlayer', error);
    }
  },

  async writeCollectionDataToFile (saveDirect = false) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!saveDirect) {
          // vor dem speichern die statistiken übernehmen
          const coll = await fs.readJSON(path.join(__extdir, 'collection.json'));

          for (const item of this.collectionData.item) {
            // entsprechendes item in vorhandenem entnehmen und statistic etc. übernehmen
            for (const itemOld of coll.item) {
              if (item.objectid === itemOld.objectid) {
                if (itemOld.statistics) {
                  item.statistics = itemOld.statistics;
                }
                if (itemOld.poll) {
                  item.poll = itemOld.poll;
                }
                if (itemOld.refreshDate) {
                  item.refreshDate = itemOld.refreshDate;
                }
                if (itemOld.rankChange) {
                  item.rankChange = itemOld.rankChange;
                  if (item.rankChange === '=') {
                    item.rankDiv = 0;
                  }
                }
                if (itemOld.rankDiv) {
                  item.rankDiv = itemOld.rankDiv;
                }
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
        logger.info('bgg - load Collection Data');
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

  async checkCollectionPlays (playData) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.collectionData) {
          await this.loadCollectionData();
        }

        let found = 0;

        for (const play of playData) {
          logger.warn('check', play.item.name);
          for (const collectionItem of this.collectionData.item) {
            if (play.item.objectid === collectionItem.objectid) {
              logger.info('found');
              found += 1;
            }
          }
        }

        if (found === playData.length) {
          resolve();
        } else {
          // neue collection anfordern
          await this.getCollectionData();

          resolve();
        }
      } catch (error) {
        reject(error);
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
          mindate = format(subDays(new Date(), 5), 'yyyy-MM-dd');
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

        // überprüfen ob die neuen partieren spiele in der collection vorhand ist wenn nicht gleich abfragen
        await this.checkCollectionPlays(this.playData);

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
        const { data } = await bggClient.get('collection', { username: this.user, played: 1 }, 10);

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
  },

  addGameDataToCollectionItem (collectionItem, gameData) {
    let oldRanking;
    let newRanking;

    // auswerten ob sich ranking geändert hat seit dem letzten mal
    if (Array.isArray(gameData.item.statistics.ratings.ranks.rank)) {
      newRanking = Number(gameData.item.statistics.ratings.ranks.rank[0].value);
      if (collectionItem.statistics) {
        oldRanking = Number(collectionItem.statistics.ratings.ranks.rank[0].value);
      } else {
        oldRanking = newRanking;
      }
    } else {
      oldRanking = Number(collectionItem.statistics.ratings.ranks.rank.value);
      newRanking = Number(gameData.item.statistics.ratings.ranks.rank.value);
      if (collectionItem.statistics) {
        oldRanking = Number(collectionItem.statistics.ratings.ranks.rank.value);
      } else {
        oldRanking = newRanking;
      }
    }

    let rankChange = '=';

    if (newRanking > oldRanking) {
      rankChange = '>';
    } else if (newRanking < oldRanking) {
      rankChange = '<';
    }

    // änderung eintragen
    collectionItem.rankChange = rankChange;
    collectionItem.rankDiv = oldRanking - newRanking;
    // eslint-disable-next-line no-param-reassign
    collectionItem.statistics = gameData.item.statistics;
    // eslint-disable-next-line no-param-reassign
    collectionItem.refreshDate = new Date();

    if (gameData.item.poll) {
      // eslint-disable-next-line no-param-reassign
      collectionItem.poll = gameData.item.poll;
    }
  },

  findOldestCollectionItemIndex () {
    let oldestIndex = -1;
    const data = this.collectionData.item;

    for (let i = 0; i < data.length; i++) {
      // wenn es noch kein datum gibt
      if (!data[i].refreshDate) {
        logger.warn('find oldest, kein datum', data[i].name.text);
        oldestIndex = i;

        break;
      }

      if (oldestIndex === -1 || new Date(data[i].refreshDate) < new Date(data[oldestIndex].refreshDate)) {
        oldestIndex = i;
      }
    }

    logger.warn('find oldest: ', data[oldestIndex].refreshDate);

    return oldestIndex;
  },

  async refreshCollectionData (objectid) {
    logger.fatal('refresh objectid', objectid);

    if (!this.collectionData) {
      await this.loadCollectionData();
    }

    if (objectid) {
      const gameData = await this.getGameData(objectid);

      // statistic der collection hinzufügen
      if (gameData) {
        let statistic;

        for (const item of this.collectionData.item) {
          if (item.objectid === objectid) {
            this.addGameDataToCollectionItem(item, gameData);

            statistic = item.statistics;

            await this.writeCollectionDataToFile(true);

            logger.info('added');

            break;
          }
        }

        return statistic;
      }
    }

    // überprüfen ob es noch spiele in der sammlung ohne statistic gibt
    for (const item of this.collectionData.item) {
      if (!item.statistics) {
        logger.info('keine statistic in ', item.name.text);

        // daten abrufen
        const gameData = await this.getGameData(item.objectid);

        // statistic der collection hinzufügen
        if (gameData && gameData.item && gameData.item.statistics) {
          this.addGameDataToCollectionItem(item, gameData);

          await this.writeCollectionDataToFile(true);

          logger.info('added');
        }

        break;
      }
    }

    // überprüfen ob es noch spiele in der sammlung ohne poll gibt
    for (const item of this.collectionData.item) {
      if (!item.poll) {
        logger.info('keine poll in ', item.name.text);

        // daten abrufen
        const gameData = await this.getGameData(item.objectid);

        // statistic der collection hinzufügen
        if (gameData && gameData.item && gameData.item.poll) {
          this.addGameDataToCollectionItem(item, gameData);

          await this.writeCollectionDataToFile(true);

          logger.info('added');
        }

        break;
      }
    }

    // überprüfen ob es noch spiele in der sammlung refresh Datum gibt
    for (const item of this.collectionData.item) {
      if (!item.refreshDate) {
        logger.info('keine refreshDate in ', item.name.text);

        // daten abrufen
        const gameData = await this.getGameData(item.objectid);

        // statistic der collection hinzufügen
        if (gameData && gameData.item && gameData.item.poll) {
          this.addGameDataToCollectionItem(item, gameData);

          await this.writeCollectionDataToFile(true);

          logger.info('added');
        }

        break;
      }
    }

    // den ältesten Eintrag aktuallisieren
    if (!objectid) {
      const oldestCollectionItemIndex = this.findOldestCollectionItemIndex();
      const collectionItem = this.collectionData.item[oldestCollectionItemIndex];

      if (collectionItem && collectionItem.objectid) {
        logger.info('rufe aktuelle daten ab ', collectionItem.name.text);

        // daten abrufen
        const gameData = await this.getGameData(collectionItem.objectid);

        // statistic und poll der collection hinzufügen
        if (gameData && gameData.item && gameData.item.statistics) {
          this.addGameDataToCollectionItem(collectionItem, gameData);

          await this.writeCollectionDataToFile(true);

          logger.info('added');
        }
      }
    }
  },

  calcRefreshTime () {
    const count = this.collectionData.item.length;
    const secWoche = 7 * 24 * 60 * 60;

    const ms = Math.round(secWoche / count * 1000);

    logger.info('ms', ms);
    logger.info('count', count);

    logger.info(`next zyclus in ${Math.round(ms / 1000 / 60 * 100) / 100} min`);

    return ms;
  },

  startRefreshZyclus (refreshTime = null) {
    if (!refreshTime) {
      refreshTime = this.calcRefreshTime();
    }

    logger.warn('starte Timeout refreshTime ', refreshTime);
    setTimeout(() => {
      this.refreshCollectionData();
      const rtime = this.calcRefreshTime();

      this.startRefreshZyclus(rtime);
    }, refreshTime);
  }
};

module.exports = bgg;
