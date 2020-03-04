import Vue from 'vue'
import App from './App.vue'
import routes from './router'

import store from './store'
import VueRouter from 'vue-router'

Vue.config.productionTip = false
/**
 * Create App to use Webpack
 * @returns {{app: Vue | object | Record<never, any>, router: VueRouter, store: Store<{}>}}
 */
export const createApp = () => {
  // Vue Router Instance
  const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
  })
  // Vue Instance
  const app = new Vue({
    router,
    store,
    render: h => h(App)
  })
  return {
    app,
    store,
    router
  }
}
