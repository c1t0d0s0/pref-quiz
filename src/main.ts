import { createApp } from 'vue';
import App from './App.vue';
import { restoreStore } from './cloud';
import { gradeFromSearch, saveGrade } from './core/storage';
import './styles/main.css';

// 前にログインしていた人がいれば、その人の写しで最初の画面を出す (Firebase の設定がないビルドでは何もしない)
restoreStore();

// ?grade=3 のように学年が指定されていたら、その学年に切りかえる
const queryGrade = gradeFromSearch(location.search);
if (queryGrade) saveGrade(queryGrade);

createApp(App).mount('#app');
