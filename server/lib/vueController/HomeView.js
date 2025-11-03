/* eslint-disable no-lonely-if */
/* eslint-disable no-undef */
'use strict';

const logger = require('../logger');
const fs = require('fs-extra');
const path = require('path');

const HomeView = {
  status: undefined,
  plays: undefined,
  statistic: undefined,
  collection: undefined,
  bgg: undefined,

  setBgg (bgg) {
    this.bgg = bgg;
  },

  start () {
    logger.info('start in HomeView');
  },

  async loadCalcData () {
    return new Promise(async (resolve, reject) => {
      try {
        const calcData = await fs.readJSON(path.join(__extdir, 'calc.json'));

        resolve(calcData);
      } catch (error) {
        reject(error);
      }
    });
  },

  async loadStatus () {
    return new Promise(async (resolve, reject) => {
      try {
        const status = await fs.readJSON(path.join(__extdir, 'status.json'));

        resolve(status);
      } catch (error) {
        reject(error);
      }
    });
  },

  async loadCollection () {
    return new Promise(async (resolve, reject) => {
      try {
        const collection = await fs.readJSON(path.join(__extdir, 'collection.json'));

        // collection von doppelten items bereinigen
        const uniqueItems = {};
        const cleanedItems = [];

        for (const item of collection.item) {
          if (!uniqueItems[item.objectid]) {
            uniqueItems[item.objectid] = true;
            cleanedItems.push(item);
          }
        }

        // wenn länge ungterschiedlich ist wieder schreiben
        if (collection.item.length !== cleanedItems.length) {
          collection.item = cleanedItems;

          await fs.writeJSON(path.join(__extdir, 'collection.json'), collection, { spaces: 2 });
        }

        resolve(collection);
      } catch (error) {
        reject(error);
      }
    });
  },

  async writeStatus (status) {
    return new Promise(async (resolve, reject) => {
      try {
        await fs.writeJson(path.join(__extdir, 'status.json'), status, { spaces: 2 });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  async init (ioClient) {
    let status = {};

    // letzten gespeicherten status laden
    try {
      status = await this.loadStatus();
    } catch (error) {
      logger.info('status konnte nicht geladen werden', error);

      // wenn das laden vom status fehl schlägt auf standard setzen
      try {
        // Spieler
        const calcData = await this.loadCalcData();

        status.players = calcData.players;

        for (const player in status.players) {
          if (Object.hasOwnProperty.call(status.players, player)) {
            status.players[player].checked = false;
          }
        }

        // Einstellungen
        status.config = {
          playerSearchMode: 'exact'
        };
      } catch (error2) {
        logger.error('fehler beim laden der calcData', error2);
      }
    }

    // überprüfen ob player eine sortValue hat, wenn nicht hinzufügen
    const sortIndex = 1;

    for (const player in status.players) {
      if (Object.hasOwnProperty.call(status.players, player)) {
        if (!status.players[player].sortValue) {
          status.players[player].sortValue = sortIndex;
        }
      }
    }

    // logger.info('status', status);
    ioClient.emit('initHome', status);
    this.status = status;
    this.collection = await this.loadCollection();
    this.statistic = await this.calcStatistic();
    ioClient.emit('setStatistic', this.statistic);
  },

  async statusChanged (ioClient, status) {
    try {
      this.status = status;
      await this.writeStatus(status);

      // statistic berechnen
      this.statistic = await this.calcStatistic();
      ioClient.emit('setStatistic', this.statistic);
    } catch (error) {
      logger.error('Fehler beim Schreiben des Status', error);
    }
  },

  checkPlayerInPlay (play, searchPlayers) {
    let match = true;

    for (const playerGame of play.players.player) {
      if (!searchPlayers[playerGame.name.toLowerCase()]) {
        match = false;
      }
    }

    return match;
  },

  async addStatisticsToCollection (objectid) {
    logger.info('addStatisticsToCollection objectid', objectid);

    const statistics = await this.bgg.refreshCollectionData(objectid);

    await this.loadCollection();

    return statistics;
  },

  async getCollectionData (play) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.collection) {
          this.collection = await this.loadCollection();
        }

        let res = {};

        for (const item of this.collection.item) {
          if (item.objectid === play.item.objectid) {
            res = item;

            // überprüfen ob für dieses Spiel schon die stats hinterlegt sind
            if (!res.statistics) {
              logger.info('addStatisticsToCollection play.item.name', play.item.name);

              // stats von bgg abrufen und hinzufügen
              res.statistics = await this.addStatisticsToCollection(res.objectid);
            }
          }
        }

        resolve(res);
      } catch (error) {
        reject(error);
      }
    });
  },

  async calcStatistic () {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.status) {
          return;
        }

        if (!this.plays) {
          // gespielte Spiele laden
          try {
            this.plays = await fs.readJSON(path.join(__extdir, 'plays.json'));
          } catch (error) {
            this.error('Fehler beim laden der plays', error);
            reject(error);
          }
        }

        // alle partien durchgehen und nach spielen mit diesen spielern suchen
        const searchPlayers = {};
        let numPlayer = 0;

        for (const key in this.status.players) {
          if (Object.hasOwnProperty.call(this.status.players, key)) {
            const player = this.status.players[key];

            if (player.checked) {
              searchPlayers[key.toLocaleLowerCase()] = player;
              numPlayer += 1;
            }
          }
        }

        const statistic = {
          plays: [],
          players: searchPlayers
        };

        statistic.countRatedPlays = 0;

        for (const play of this.plays) {
          if (play.players.player.length === numPlayer) {
            if (this.checkPlayerInPlay(play, searchPlayers)) {
              // infos aus collection data hinzufügen
              play.collection = await this.getCollectionData(play);

              if (!play.collection.name) {
                play.collection.name = {
                  text: play.item.name
                };
              }

              statistic.plays.push(play);

              if (play.nowinstats !== '1') {
                statistic.countRatedPlays += 1;

                // plazierung und punkte für spieler
                for (const name in statistic.players) {
                  if (Object.hasOwnProperty.call(statistic.players, name)) {
                    const player = statistic.players[name];

                    if (!player.points) {
                      player.points = 0;
                    }
                    const points = this.getPlayerPoints(name, play);

                    player.points += points;

                    // logger.info('player player.name', player.name);
                    // logger.info('player player.points', player.points);
                    // logger.info('player spiel', play.item.name);

                    // punkte auch in partie reinschreiben
                    for (const pplayer of play.players.player) {
                      if (pplayer.name.toLowerCase() === name) {
                        pplayer.points = points;
                        if (pplayer.win === 1) {
                          if (!player.win) {
                            player.win = 0;
                          }

                          player.win += 1;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

        statistic.collection = this.collection;
        resolve(statistic);
      } catch (error) {
        reject(error);
      }
    });
  },

  berPoints (length, weight, score, maxScore, noScore) {
    let factorLength = 0.42;
    let factorWeight = 0.42;

    if (noScore) {
      factorLength /= 2;
      factorWeight /= 2;
    }

    const pLength = length / 60.0 * factorLength;
    const pWeight = weight * factorWeight;

    let erg = pLength + pWeight;

    erg *= score / maxScore;
    erg = Math.round(erg * 1000) / 1000;

    return erg;
  },

  getPlayerPoints (name, play) {
    const gPlayers = play.players.player;
    let playerData;
    let points = 0;
    let weight = 1;
    let maxScore = 0;
    let minScore = 999999;
    let noScore = true;
    let scoreCount = 0;

    // score von dem spieler
    let pScore;

    for (const gp of gPlayers) {
      if (gp.score !== '' && gp.score !== null && gp.score !== undefined && gp.score !== 'null') {
        scoreCount += 1;

        const sc = Number(gp.score);

        if (sc > maxScore) {
          maxScore = sc;
        }
        if (sc < minScore) {
          minScore = sc;
        }
        if (gp.name.toLowerCase() === name) {
          playerData = gp;
        }
        if (gp.name.toLowerCase() === name && gp.score !== '') {
          pScore = Number(gp.score);
        }
      } else {
        if (gp.name.toLowerCase() === name) {
          playerData = gp;
        }
      }
    }

    if (scoreCount === gPlayers.length) {
      noScore = false;
    }

    if (play.collection.statistics) {
      // logger.info(' averageweight', play.collection.statistics.ratings.averageweight.value);
      weight = play.collection.statistics.ratings.averageweight.value;
    }

    if (noScore) {
      // wenn kein score

      // wenn Spieler gewonnen hat
      if (playerData.win === 1) {
        points = this.berPoints(play.length, weight, 100, 100, true);
      } else {
        // ansonsten halbe punkte
        points = this.berPoints(play.length, weight, 50, 100, true);
      }
    } else {
      // platzierung ermitteln
      if (this.checkMaxPointsWin(gPlayers)) {
        // größte punktzahl gewinnt
        let offset = 0;

        if (minScore <= 0) {
          offset = (minScore * -1) + 1;

          // logger.error('score ist unter null', minScore, offset);
          // logger.warn('score', pScore);
        }

        // Bei Arche Nova werden 60 Punkte hinzugezählt um es gerechter zu machen
        if (play.item.objectid === '342942') {
          pScore += 60;
          maxScore += 60;
        }

        // wenn maximale punktezahl gewinnt
        // logger.warn(' pScore', pScore);
        // logger.warn('maxScore', maxScore);
        if (playerData.win === 0 && pScore === maxScore) {
          // logger.warn('gleiche Punktzahl aber nicht gewonnen');
          points = this.berPoints(play.length, weight, pScore - 1 + offset, maxScore + offset);
        } else {
          points = this.berPoints(play.length, weight, pScore + offset, maxScore + offset);
        }
      } else {
        // kleinere Punktzahl gewinnt
        // wenn Spieler gewonnen hat
        if (playerData.win === 1) {
          points = this.berPoints(play.length, weight, 100, 100, true);
        } else {
          // ansonsten halbe punkte
          points = this.berPoints(play.length, weight, 50, 100, true);
        }
      }
    }

    // logger.fatal('name playerData.name', playerData.name);
    // logger.warn('points', points);

    return points;
  },

  checkMaxPointsWin (player) {
    // feststellen ob kleine oder große punktzahl gewinnt
    let winPoints;
    let winMax = true;

    // score vom sieger
    for (const gp of player) {
      // eslint-disable-next-line eqeqeq
      if (gp.win === 1) {
        winPoints = Number(gp.score);
      }
    }

    // überprüfen ob der score der anderen niedrieger ist
    for (const gp of player) {
      // eslint-disable-next-line eqeqeq
      if (gp.win !== 1 && Number(gp.score) > winPoints) {
        winMax = false;
      }
    }

    return winMax;
  },

  async downloadPlays (ioClient, payload) {
    logger.fatal('downloadPlays', payload);
    await this.bgg.getPlayData(payload, (value, total) => {
      ioClient.emit('statusGetPlayData', { value, total });
    });
    this.plays = undefined;
    this.status = await this.loadStatus();
    this.collection = await this.loadCollection();
    ioClient.emit('initHome', this.status);
    ioClient.emit('downloadFinished');
  },

  async downloadCatalog (ioClient) {
    logger.fatal('downloadCatalog');
    await this.bgg.getCollectionData();
    this.collection = await this.loadCollection();
    ioClient.emit('downloadFinished');
  }
};

HomeView.start();

module.exports = HomeView;
