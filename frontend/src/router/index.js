import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'), // lazy-loaded
  },
  {
    path: '/archive',
    name: 'Archive',
    component: () => import('../views/Archive.vue'),
  },
  {
    path: '/event/:year/:month/:day',
    name: 'Event',
    component: () => import('../views/Event.vue'),
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard Index',
    component: () => import('../views/LeaderboardIndex.vue'),
  },
  {
    path: '/leaderboard/:slug',
    name: 'Leaderboard',
    component: () => import('../views/Leaderboard.vue'),
  },
  {
    path: '/segment/:id',
    name: 'Segment',
    component: () => import('../views/Segment.vue'),
  },
  {
    path: '/players',
    name: 'Player Index',
    component: () => import('../views/PlayerIndex.vue'),
  },
  {
    path: '/player/:username',
    name: 'Player',
    component: () => import('../views/Player.vue'),
  },
  {
    path: '/doc/:slug',
    name: 'Doc',
    component: () => import('../views/Doc.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
