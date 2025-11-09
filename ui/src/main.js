import App from './App.vue';
import { createApp } from 'vue';
import { io } from 'socket.io-client';
import router from './router';
import store from './store';
import VueSocketIO from 'vue-3-socket.io';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap-grid.min.css';
import 'bootstrap/dist/css/bootstrap-reboot.min.css';
import 'bootstrap/dist/css/bootstrap-utilities.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// import "bootstrap";

const app = createApp(App).use(store).use(router);

// Client side Socket.IO object

console.log('Environment Mode:', import.meta.env.MODE);

const socket = io('https://my-statistic.soseies.de');

// const socket = import.meta.env.MODE === 'development' ?
//   io('http://localhost:3000') :
//   io('https://my-statistic.soseies.de');

app.use(new VueSocketIO({
  debug: true,
  connection: socket

  // vuex: {
  //     store,
  //     actionPrefix: 'SOCKET_',
  //     mutationPrefix: 'SOCKET_'
  // },
  // options: { path: "/my-app/" } //Optional options
}));

app.mount('#app');
