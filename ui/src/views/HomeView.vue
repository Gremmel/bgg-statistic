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
          href="#"
          @click="tabViewClick('rating')"
        >Wertung</a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link disabled"
          href="#"
          tabindex="-1"
          aria-disabled="true"
          @click="tabViewClick('z')"
        >Disabled</a>
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
            <div class="col-3 text-start">
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
              <!-- Aufklappbare zusatzinfo -->
              <div
                :id="'collapse' + play.id"
                class="row collapse card p-1"
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
                              <span class="badge bg-primary rounded-pill">
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
      sdgf
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
    max-height: 4rem;
    max-width: 4rem;
  }
</style>
