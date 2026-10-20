import { createApp } from 'vue';
import App from './App.vue';
import { restoreStore } from './cloud';
import './styles/main.css';

// 前にログインしていた人がいれば、その人の写しで最初の画面を出す (Firebase の設定がないビルドでは何もしない)
restoreStore();
createApp(App).mount('#app');
