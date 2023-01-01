<template>
  <div class="home">
    <h1>Home</h1>
    <p>{{ msg }}</p>
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
      msg: ''
    };
  },
  sockets: {
    connect () {
      console.log('socket HomeView connected');
      this.toServer('init', 'hallo vom client');
    },
    initHome (data) {
      this.msg = data.msg;
    }
  },
  mounted () {
    console.log('HomeView Mounted', this.$socket.connected);
    if (this.$socket.connected) {
      this.toServer('init', 'hallo vom client');
    }
  },
  methods: {
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
</style>
