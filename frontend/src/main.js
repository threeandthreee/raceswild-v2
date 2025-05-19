/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

import { registerPlugins } from '@/plugins'
import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import 'unfonts.css'

const app = createApp(App)
registerPlugins(app)
app.use(createPinia())
app.use(router)
app.mount('#app')
