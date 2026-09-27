import App from './App.svelte';
import { initStores } from './stores';

void initStores().then(() => new App({ target: document.getElementById('app')! }));
