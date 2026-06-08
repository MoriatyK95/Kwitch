import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './styles.css';

// Note: the AtomicXCore SDK auto-imports its own component stylesheet from its
// entry module, so no manual CSS import is needed here.

createApp(App).use(router).mount('#app');
