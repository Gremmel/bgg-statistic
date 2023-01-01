import App from './App.vue';
import { createApp } from 'vue';
import { io } from 'socket.io-client';
import router from './router';
import store from './store';
import VueSocketIO from 'vue-3-socket.io';
import 'bootstrap/dist/css/bootstrap.min.css';

// import "bootstrap";

const app = createApp(App).use(store).use(router);

// Client side Socket.IO object
// dev
const socket = io('http://localhost:3000');

// normal
// const socket = io();

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
