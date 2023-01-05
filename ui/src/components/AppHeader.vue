<!-- eslint-disable vue/max-attributes-per-line -->
<!-- eslint-disable vue/singleline-html-element-content-newline -->
<template>
  <header>
    <div data-bs-theme="dark" class="p-1 text-light bg-dark">
      <h4 class="">Board Game Statistik</h4>
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
      ioConnected: false
    };
  },
  sockets: {
    connect () {
      console.log('socket Header connected');
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
  h4 {
    margin: 0px;
  }
</style>
