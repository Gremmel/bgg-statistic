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

    // logger.info('status', status);
    ioClient.emit('initHome', status);
    this.status = status;
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

                    // punkte auch in partie reinschreiben
                    for (const pplayer of play.players.player) {
                      if (pplayer.name.toLowerCase() === name) {
                        pplayer.points = points;
                        if (pplayer.win === '1') {
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

        resolve(statistic);
      } catch (error) {
        reject(error);
      }
    });
  },

  getPlayerPoints (name, play) {
    const numPlayer = play.players.player.length;
    const gPlayers = play.players.player;
    let playerData;
    let points = 0;

    // score von dem spieler
    let pScore;

    for (const gp of gPlayers) {
      if (gp.name.toLowerCase() === name) {
        playerData = gp;
      }
      if (gp.name.toLowerCase() === name && gp.score !== '') {
        pScore = gp.score;
      }
    }

    // wenn spieldauer unter 30 min dann gibts nur einen halben punkt für den sieg
    if (play.length < 30) {
      // eslint-disable-next-line eqeqeq
      if (playerData.win == '1') {
        points = 0.5;
      } else {
        // ansonsten null punkte
        points = 0;
      }
    } else if (pScore === undefined || pScore === 'null') {
      // wenn kein score
      // wenn Spieler gewonnen hat
      // eslint-disable-next-line eqeqeq
      if (playerData.win == '1') {
        points = 3;
      } else {
        // ansonsten null punkte
        points = 0;
      }
    // eslint-disable-next-line eqeqeq
    } else if (playerData.win == '1') {
      // wenn Spieler gewonnen hat dann punkte (anzahl Spieler minus 1)
      points = 3;
    } else if (this.checkMaxPointsWin(gPlayers)) {
      // platzierung ermitteln
      for (const gp of gPlayers) {
        if (gp.name.toLowerCase() !== name && Number(pScore) >= Number(gp.score) && gp.win !== '1') {
          points += 1;
        }
      }

      // zweiter Platz
      if (points === numPlayer - 2) {
        points = 2;
        if (numPlayer === 2) {
          points = 0;
        }
      } else if (points === numPlayer - 3) {
        // dritter Platz
        points = 1;
        if (numPlayer === 3) {
          points = 0;
        }
      } else {
        points = 0;
      }
    } else {
      for (const gp of gPlayers) {
        if (gp.name.toLowerCase() !== name && Number(pScore) <= Number(gp.score)) {
          points += 1;
        }
      }
    }

    return points;
  },

  checkMaxPointsWin (player) {
    // feststellen ob kleine oder große punktzahl gewinnt
    let winPoints;
    let winMax = true;

    // score vom sieger
    for (const gp of player) {
      // eslint-disable-next-line eqeqeq
      if (gp.win == '1') {
        winPoints = Number(gp.score);
      }
    }

    // überprüfen ob der score der anderen niedrieger ist
    for (const gp of player) {
      // eslint-disable-next-line eqeqeq
      if (gp.win !== '1' && Number(gp.score) > winPoints) {
        winMax = false;
      }
    }

    return winMax;
  },

  async downloadPlays (ioClient) {
    logger.fatal('downloadPlays');
    await this.bgg.getPlayData((value, total) => {
      ioClient.emit('statusGetPlayData', { value, total });
    });
    this.plays = undefined;
    ioClient.emit('downloadFinished');
  },

  async downloadCatalog (ioClient) {
    logger.fatal('downloadCatalog');
    await this.bgg.getCollectionData();
    await this.loadCollection();
    ioClient.emit('downloadFinished');
  }
};

HomeView.start();

module.exports = HomeView;
