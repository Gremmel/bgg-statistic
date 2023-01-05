<template>
  <div class="home">
    <!-- Navleiste -->
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{active: status.tabView === 'player'}"
          href="#"
          @click="tabViewClick('player')"
        >Spieler</a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{active: status.tabView === 'plays'}"
          href="#"
          @click="tabViewClick('plays')"
        >Partien</a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{active: status.tabView === 'rating'}"
          href="#"
          @click="tabViewClick('rating')"
        >Wertung</a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{active: status.tabView === 'bgg'}"
          href="#"
          @click="tabViewClick('bgg')"
        >BGG</a>
      </li>
    </ul>

    <!-- Spieleransicht -->
    <div v-show="status.tabView === 'player'">
      <ol class="list-group">
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

    <div v-show="status.tabView === 'plays'">
      <ol class="list-group">
        <li
          v-for="play in statistic.plays"
          :key="play.id"
          class="list-group-item"
          :class="{'list-group-item-secondary': play.nowinstats === '1'}"
        >
          <div class="row">
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
                    class="badge bg-primary rounded-pill me-1"
                  >
                    {{ player.name }}
                  </span>
                </div>
              </div>
              <!-- Aufklappbare zusatzinfo -->
              <div
                :id="'collapse' + play.id"
                class="row collapse card p-1 mt-1"
              >
                <div class="col">
                  <!-- Punkte -->
                  <div class="row">
                    <div class="col">
                      <table class="table">
                        <tbody>
                          <tr
                            v-for="player in play.players.player"
                            :key="player.name"
                            :class="{'table-success': player.win === '1'}"
                          >
                            <td>{{ player.name }}</td>
                            <td>
                              <span v-if="player.points > 0" class="badge bg-primary rounded-pill">
                                {{ player.points }}
                              </span>
                            </td>
                            <td>{{ player.score }}</td>
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

    <div v-show="status.tabView === 'rating'">
      <div class="container text-start">
        <div class="row">
          <div class="col">
            gewertete Partien:
          </div>
          <div class="col">
            {{ statistic.countRatedPlays }}
          </div>
        </div>
        <div class="row">
          <!-- treppchen -->
          <div class="treppe">
            <img
              src="treppchen.jpg"
              alt="siegertreppe"
              style="width: 100%;"
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
              {{ ratedPlayers[0].points }}
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
              {{ ratedPlayers[1].points }}
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
              {{ ratedPlayers[2].points }}
            </span>
          </div>
          <!-- der rest -->
          <div>
            <table class="table">
              <tbody>
                <tr
                  v-for="player in restOfPlayers"
                  :key="'tr' + player.name"
                >
                  <td>{{ player.name }}</td>
                  <td>{{ player.points }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'HomeView',
  components: {
  },

  data () {
    return {
      name: 'HomeView',
      ioConnected: false,
      status: {},
      statistic: {}
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
    }
  },
  computed: {
    ratedPlayers () {
      const unsorted = [];

      for (const key in this.statistic.players) {
        if (Object.hasOwnProperty.call(this.statistic.players, key)) {
          const player = this.statistic.players[key];

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
  mounted () {
    console.log('HomeView Mounted', this.$socket.connected);
    if (this.$socket.connected) {
      this.toServer('init', 'hallo vom client');
    }
  },
  methods: {
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
  .thumbnail {
    max-height: 5rem;
    max-width: 4rem;
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

</style>
