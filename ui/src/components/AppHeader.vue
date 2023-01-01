<template>
  <header>
    <div class="p-1">
      <h1>Board Game Statistik</h1>
    </div>
  </header>
</template>

<script>
export default {
  name: 'AppHeader',
  props: {
  },
  data () {
    return {
      ioConnected: false,
      msg: ''
    };
  },
  sockets: {
    connect () {
      console.log('socket Header connected');
      this.toServer('init', 'Hallo vom Client');
    },
    initAppHeader (data) {
      this.msg = data.msg;
    }
  },
  mounted () {
    console.log('asdf', this.$options);
    if (this.$socket && this.$socket.connected) {
      this.toServer('init', 'Hallo vom Client');
    }
  },
  methods: {
    toServer (callFunction, payload) {
      const data = {
        callFunction,
        payload
      };

      console.log(this.$options.name, data);
      this.$socket.emit(this.$options.name, data);
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  header {
    background-color: #e6e6e6;
  }

  h1 {
    margin: 0px;
  }
</style>
