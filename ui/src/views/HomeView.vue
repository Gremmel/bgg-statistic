<!-- eslint-disable vue/attributes-order -->
<!-- eslint-disable vue/singleline-html-element-content-newline -->
<!-- eslint-disable vue/max-attributes-per-line -->
<template>
  <div data-bs-theme="dark" class="home bg-dark">
    <!-- Navleiste -->
    <ul class="nav nav-tabs bg-dark">
      <li class="nav-item">
        <a
          class="nav-link text-secondary"
          :class="{'active text-light bg-secondary': status.tabView === 'player'}"
          href="#"
          @click="tabViewClick('player')"
        >Spieler</a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link text-secondary"
          :class="{'active text-light bg-secondary': status.tabView === 'collection'}"
          href="#"
          @click="tabViewClick('collection')"
        >Spiele</a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link text-secondary"
          :class="{'active text-light bg-secondary': status.tabView === 'plays'}"
          href="#"
          @click="tabViewClick('plays')"
        >Partien</a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link text-secondary"
          :class="{'active text-light bg-secondary': status.tabView === 'rating'}"
          href="#"
          @click="tabViewClick('rating')"
        >Wertung</a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link text-secondary"
          :class="{'active text-light bg-secondary': status.tabView === 'bgg'}"
          href="#"
          @click="tabViewClick('bgg')"
        >BGG</a>
      </li>
    </ul>

    <!-- Spieleransicht -->
    <div v-show="status.tabView === 'player'">
      <ol class="list-group p-2">
        <li
          v-for="(player, key) in status.players"
          :key="key"
          class="list-group-item d-flex align-items-start"
        >
          <div class="form-check form-switch ms-1">
            <input
              :id="key"
              v-model="player.checked"
              class="form-check-input"
              type="checkbox"
              role="switch"
              @click="playerClicked(key)"
            >
            <label
              class="form-check-label"
              :for="key"
            >{{ player.name }}</label>
          </div>
        </li>
      </ol>
    </div>

    <div class="container bg-dark" v-show="status.tabView === 'collection'">
      <div class="input-group mb-3">
        <input v-model="searchText" type="text" class="form-control" placeholder="finde...">
        <button @click="clickClearTextSearch" class="btn btn-outline-secondary" type="button" id="button-addon2">X</button>
      </div>
      <ol class="list-group">
        <li
          v-for="collectionItem in collection"
          :key="collectionItem.id"
          class="list-group-item list-group-item-plays text-light bg-dark"
        >
          <div class="row" data-bs-toggle="collapse" :data-bs-target="'#collapse' + collectionItem.collid" aria-expanded="false" :aria-controls="'collapse' + collectionItem.collid">
            <div class="col-auto text-start" style="min-width: 100px;">
              <img
                :src="collectionItem.thumbnail"
                class="thumbnail"
                alt="thumbnail"
                data-bs-toggle="collapse"
                :data-bs-target="'#collapse' + collectionItem.collid"
                aria-expanded="false"
                :aria-controls="'collapse' + collectionItem.collid"
              ><br>
              <span
                v-if="collectionItem.status.own == '1'"
                class="badge rounded-pill text-bg-success"
              >
                Own
              </span>
            </div>
            <div class="col text-start">
              <div class="row">
                <div class="col">
                  <div class="row">
                    <div class="col p-0">
                      <a style="text-decoration: none; color: white;" :href="`https://boardgamegeek.com/boardgame/${collectionItem.objectid}`" target="_blank">
                        <span style="font-weight: bold;">{{ collectionItem.name.text }}</span>
                      </a>
                      <span
                        v-if="collectionItem?.statistics?.ratings?.ranks?.rank?.value || false"
                        class="ms-2 badge rounded-pill text-bg-primary"
                        :class="{ 'text-bg-warning': collectionItem?.statistics?.ratings?.ranks?.rank?.value < 100 }"
                      >
                        {{ collectionItem.statistics.ratings.ranks.rank.value }}
                      </span>
                      <span
                        v-if="collectionItem?.statistics?.ratings?.ranks?.rank[0]?.value || false"
                        class="ms-2 badge rounded-pill text-bg-primary"
                        :class="{ 'text-bg-warning': collectionItem?.statistics?.ratings?.ranks?.rank[0]?.value < 100 }"
                      >
                        {{ collectionItem.statistics.ratings.ranks.rank[0].value }}
                      </span>
                      <span
                        v-if="collectionItem.rankDiv !== 'undefined' || false"
                        class="ms-2 badge rounded-pill"
                        :class="{
                          'bg-secondary': collectionItem.rankChange === '=',
                          'bg-success': collectionItem.rankChange === '<',
                          'bg-danger': collectionItem.rankChange === '>'
                        }"
                      >
                        <span v-if="collectionItem.rankDiv > 0">+</span><span v-if="collectionItem.rankDiv !== 0">{{ collectionItem.rankDiv }}</span>
                        <span v-if="collectionItem.rankDiv === 0">=</span>
                      </span>
                    </div>
                  </div>
                  <div class="row">
                    Jahr: {{ collectionItem.yearpublished }}
                  </div>
                  <div v-if="collectionItem.numplays > 0" class="row">
                    gespielt: {{ collectionItem.numplays }}
                  </div>
                  <div v-if="collectionItem.statistics" class="col">
                    <div class="card bg-dark border-success">
                      <div class="card-body pt-1 pb-1">
                        <div class="row">
                          Bewertung: {{ Math.round(collectionItem.statistics.ratings.average.value * 100) / 100 }} ({{ collectionItem.statistics.ratings.usersrated.value }})
                        </div>
                        <div class="row">
                          Komplexität: {{ Math.round(collectionItem.statistics.ratings.averageweight.value * 100) / 100 }} ({{ collectionItem.statistics.ratings.numweights.value }})
                        </div>
                        <div v-if="collectionItem.refreshDateDisplay" class="row">
                          <div style="font-size: 0.9rem; color: lightgray;">
                            aktuallisiert: {{ collectionItem.refreshDateDisplay }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Aufklappbare zusatzinfo -->
              <div :id="'collapse' + collectionItem.collid" />
            </div>
          </div>
        </li>
      </ol>
    </div>

    <div class="container bg-dark" v-show="status.tabView === 'plays'">
      <div class="input-group mb-3">
        <input v-model="searchText" type="text" class="form-control" placeholder="finde...">
        <button @click="clickClearTextSearch" class="btn btn-outline-secondary" type="button" id="button-addon2">X</button>
      </div>
      <ol class="list-group">
        <li
          v-for="play in plays"
          :key="play.id"
          class="list-group-item list-group-item-plays text-light"
          :class="{'bg-secondary': play.nowinstats === '1', 'bg-dark': play.nowinstats === '0'}"
        >
          <div class="row" data-bs-toggle="collapse" :data-bs-target="'#collapse' + play.id" aria-expanded="false" :aria-controls="'collapse' + play.id">
            <div class="col-auto text-start">
              <img
                :src="play.collection.thumbnail"
                class="thumbnail"
                alt="thumbnail"
                data-bs-toggle="collapse"
                :data-bs-target="'#collapse' + play.id"
                aria-expanded="false"
                :aria-controls="'collapse' + play.id"
              >
            </div>
            <div class="col text-start">
              <div class="row">
                <div class="col">
                  {{ play.collection.name.text }}
                </div>
              </div>
              <div class="row">
                <div class="col">
                  {{ play.date }}
                </div>
                <div class="col">
                  {{ play.length }} min
                </div>
              </div>
              <div class="row">
                <div class="col">
                  <span
                    v-for="player in play.players.player"
                    v-show="player.win === '1'"
                    :key="player.name"
                    class="badge bg-secondary rounded-pill me-1"
                  >
                    {{ player.name }}
                  </span>
                </div>
              </div>
              <!-- Aufklappbare zusatzinfo -->
              <div
                :id="'collapse' + play.id"
                class="row collapse card bg-light p-1 m-1"
              >
                <div class="col">
                  <!-- Punkte -->
                  <div class="row">
                    <div class="col p-1">
                      <table class="table m-0">
                        <tbody>
                          <tr
                            v-for="player in play.players.player"
                            :key="player.name"
                            :class="{'bg-success': player.win === '1'}"
                          >
                            <td class="p-1">{{ player.name }}</td>
                            <td class="p-1">
                              <span
                                v-if="player.points > 0"
                                class="badge bg-dark rounded-pill"
                              >
                                {{ player.points }}
                              </span>
                            </td>
                            <td class="p-1">{{ player.score }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <!-- Kommentar -->
                  <div
                    v-if="play.commentsFehler"
                    class="row"
                  >
                    <div class="col">
                      {{ play.comments }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ol>
    </div>

    <div class="bg-dark text-light" v-show="status.tabView === 'rating'">
      <div class="container text-start">
        <div class="row">
          <div class="col">
            gewertete Partien:
          </div>
          <div class="col">
            {{ statistic.countRatedPlays }}
          </div>
        </div>
        <div class="row text-dark">
          <!-- treppchen -->
          <div class="treppe">
            <img
              src="treppchen.jpg"
              alt="siegertreppe"
              style="width: 100%;"
              class="imgTreppchen"
            >
            <span
              v-if="ratedPlayers[0]"
              class="player1"
            >
              {{ ratedPlayers[0].name }}
            </span>
            <span
              v-if="ratedPlayers[0]"
              class="pointsPlayer1"
            >
              {{ ratedPlayers[0].points }} ({{ ratedPlayers[0].win }})
            </span>
            <span
              v-if="ratedPlayers[1]"
              class="player2"
            >
              {{ ratedPlayers[1].name }}
            </span>
            <span
              v-if="ratedPlayers[1]"
              class="pointsPlayer2"
            >
              {{ ratedPlayers[1].points }} ({{ ratedPlayers[1].win }})
            </span>
            <span
              v-if="ratedPlayers[2]"
              class="player3"
            >
              {{ ratedPlayers[2].name }}
            </span>
            <span
              v-if="ratedPlayers[2]"
              class="pointsPlayer3"
            >
              {{ ratedPlayers[2].points }} ({{ ratedPlayers[2].win }})
            </span>
          </div>
          <!-- der rest -->
          <div>
            <table class="table text-light">
              <tbody>
                <tr
                  v-for="player in restOfPlayers"
                  :key="'tr' + player.name"
                >
                  <td>{{ player.name }}</td>
                  <td>{{ player.points }} ({{ player.win }})</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-dark text-light" v-show="status.tabView === 'bgg'">
      <div class="container text-center">
        <button :disabled="disableBtnDownload" @click="clickDownloadPlays(false)" type="button" class="btn btn-secondary mt-5">Partien neu von BGG Laden (5 Tage)</button><br>
        <button :disabled="disableBtnDownload" @click="clickDownloadPlays(true)" type="button" class="btn btn-secondary mt-5">Partien neu von BGG Laden (alle)</button><br>
        <button :disabled="disableBtnDownload" @click="clickDownloadCatalog()" type="button" class="btn btn-secondary mt-2">Sammlung neu von BGG Laden</button>
      </div>
      <div v-if="downloadProgressStyle !== ''" class="progress m-4" role="progressbar" aria-label="Success striped example" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar progress-bar-striped bg-success" :style="downloadProgressStyle" />
      </div>
    </div>
  </div>
</template>

<script>

import Fuse from 'fuse.js';

export default {
  name: 'HomeView',
  components: {
  },

  data () {
    return {
      name: 'HomeView',
      ioConnected: false,
      status: {},
      statistic: {},
      disableBtnDownload: false,
      downloadPlaysCount: {
        value: 0,
        total: 10
      },
      fuseOptions: {
        // isCaseSensitive: false,
        // includeScore: false,
        // shouldSort: true,
        // includeMatches: false,
        // findAllMatches: false,
        // minMatchCharLength: 2,

        // location: 0,
        threshold: 0.5,

        // distance: 100,
        // useExtendedSearch: false,
        // ignoreLocation: false,
        // ignoreFieldNorm: false,
        // fieldNormWeight: 1,
        keys: [
          'name.text',
          'yearpublished'
        ]
      },
      fuseOptionsPlays: {
        // isCaseSensitive: false,
        // includeScore: false,
        // shouldSort: true,
        // includeMatches: false,
        // findAllMatches: false,
        // minMatchCharLength: 2,

        // location: 0,
        threshold: 0.5,

        // distance: 100,
        // useExtendedSearch: false,
        // ignoreLocation: false,
        // ignoreFieldNorm: false,
        // fieldNormWeight: 1,
        keys: [
          'item.name'
        ]
      },
      fuseCollection: null,
      fusePlays: null,
      searchText: ''
    };
  },
  sockets: {
    connect () {
      console.log('socket HomeView connected');
      this.toServer('init');
    },
    initHome (status) {
      console.log('initHome', status);
      if (status.players) {
        const sorted = Object.keys(status.players).sort().reduce((acc, key) => ({
          ...acc, [key]: status.players[key]
        }), {});

        // eslint-disable-next-line no-param-reassign
        status.players = sorted;
      }

      this.status = status;
    },
    setStatistic (statistic) {
      console.log('statistic', statistic);
      this.statistic = statistic;

      this.fusePlays = new Fuse(this.statistic.plays, this.fuseOptionsPlays);
      this.fuseCollection = new Fuse(this.statistic.collection.item, this.fuseOptions);
    },
    downloadFinished () {
      this.disableBtnDownload = false;
      this.downloadPlaysCount.value = 0;
      this.status.tabView = 'rating';
      this.sendStatusChanged();
    },
    statusGetPlayData (data) {
      this.downloadPlaysCount.value = data.value;
      this.downloadPlaysCount.total = data.total;
    }
  },
  computed: {
    plays () {
      if (!this.statistic.plays) {
        return [];
      }

      let playsCopy = [];

      if (this.searchText !== '' && this.status.tabView === 'plays') {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        const searchList = this.fusePlays.search(this.searchText);

        for (const obj of searchList) {
          playsCopy.push(obj.item);
        }
      } else {
        playsCopy = [ ...this.statistic.plays ];

        // eslint-disable-next-line id-length
        playsCopy.sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      // eslint-disable-next-line id-length

      return playsCopy;
    },
    collection () {
      const res = [];

      if (this.statistic.collection && this.statistic.collection.item && this.status.tabView === 'collection') {
        if (this.searchText !== '') {
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          const searchList = this.fuseCollection.search(this.searchText);

          for (const obj of searchList) {
            if (obj.item.numplays > 0) {
              res.push(obj.item);
            }
          }
        } else {
          // sortieren nach playreihenfolge
          const zugeordnet = {};

          for (const play of this.plays) {
            console.log('play play', play);

            for (const obj of this.statistic.collection.item) {
              if (play.item.objectid === obj.objectid) {
                if (!zugeordnet[obj.objectid]) {
                  res.push(obj);
                  zugeordnet[obj.objectid] = true;
                }
              }
            }
          }
        }

        for (const item of res) {
          if (item.refreshDate) {
            // Das gespeicherte refreshDate in ein Date-Objekt umwandeln
            const refreshDate = new Date(item.refreshDate);

            // Die Differenz in Millisekunden berechnen
            const aktuellesDatum = new Date();
            const differenzInMillisekunden = aktuellesDatum - refreshDate;

            // Die Differenz in Tage umrechnen
            const differenzInTage = Math.round(differenzInMillisekunden / (1000 * 60 * 60 * 24));

            if (differenzInTage === 0) {
              item.refreshDateDisplay = 'heute';
            } else if (differenzInTage === 1) {
              item.refreshDateDisplay = 'gestern';
            } else {
              item.refreshDateDisplay = `vor ${differenzInTage} Tagen`;
            }
          }
        }

        return res;
      }

      return res;
    },
    downloadProgressStyle () {
      let str = '';

      if (this.downloadPlaysCount.value > 0) {
        str = 'width: ' + (this.downloadPlaysCount.value / this.downloadPlaysCount.total * 100) + '%';
      }

      return str;
    },
    ratedPlayers () {
      const unsorted = [];

      for (const key in this.statistic.players) {
        if (Object.hasOwnProperty.call(this.statistic.players, key)) {
          const player = this.statistic.players[key];

          player.points = Math.round(player.points * 100) / 100;

          unsorted.push(player);
        }
      }

      const sorted = unsorted.slice(0);

      console.log('sorted', sorted);
      console.log('unsorted', unsorted);

      // eslint-disable-next-line id-length
      sorted.sort((a, b) => b.points - a.points);

      return sorted;
    },
    restOfPlayers () {
      const arr = this.ratedPlayers.slice(3);

      return arr;
    }
  },
  created () {
    //
  },
  mounted () {
    console.log('HomeView Mounted', this.$socket.connected);
    if (this.$socket.connected) {
      this.toServer('init', 'hallo vom client');
    }
  },
  methods: {
    clickClearTextSearch () {
      this.searchText = '';
    },
    clickDownloadPlays (all) {
      this.disableBtnDownload = true;
      this.toServer('downloadPlays', all);
    },
    clickDownloadCatalog () {
      this.disableBtnDownload = true;
      this.toServer('downloadCatalog');
    },
    async playerClicked (playername) {
      console.log('player clicked', playername);
      this.sendStatusChanged();
    },
    sendStatusChanged () {
      setTimeout(() => {
        this.toServer('statusChanged', this.status);
      }, 100);
    },
    tabViewClick (value) {
      this.status.tabView = value;
      this.sendStatusChanged();
    },
    toServer (callFunction, payload) {
      const data = {
        callFunction,
        payload
      };

      console.log(this.name, data);
      this.$socket.emit(this.name, data);
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .list-group-item-plays {
    border-color: #353535;
  }
  .thumbnail {
    max-height: 5rem;
    max-width: 4rem;
    border-radius: 0.5rem;
  }

  .treppe {
    position: relative;
  }

  .player1 {
    position: absolute;
    top:28%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2rem;
  }

  .pointsPlayer1 {
    position: absolute;
    top:20%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.3rem;
  }

  .player2 {
    position: absolute;
    top: 40%;
    left: 36%;
    transform: translate(-100%, -50%);
    font-size: 1.5rem;
  }

  .pointsPlayer2 {
    position: absolute;
    top: 34%;
    left: 27%;
    transform: translate(-50%, -50%);
    font-size: 1rem;
  }

  .player3 {
    position: absolute;
    top:44%;
    left: 64%;
    transform: translate(-0%, -50%);
    font-size: 1.5rem;
  }

  .pointsPlayer3 {
    position: absolute;
    top:38%;
    left: 72%;
    transform: translate(-50%, -50%);
    font-size: 1rem;
  }

  .form-check-input:checked {
    background-color: #212529;
    border-color: #212529;
  }
  .form-check-input:focus {
    border-color: #6b6b6b;
    outline: 0;
    box-shadow: 0 0 0 .25rem rgba(114, 114, 114, 0.25);
  }

  .imgTreppchen {
    border-radius: 1rem;
  }

</style>
