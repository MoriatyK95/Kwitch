import { createRouter, createWebHistory } from 'vue-router';

/**
 * Three routes mirror the three core Twitch/Kick surfaces:
 *   /          Browse  — grid of live channels (fetchLiveList)
 *   /go-live   GoLive  — host: device select + StreamMixer + startLive
 *   /watch/:id Watch   — viewer: LiveView + joinLive + event handling
 *
 * Components are lazy-loaded so each page's SDK usage is code-split.
 */
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'browse',
      component: () => import('@/pages/BrowsePage.vue'),
    },
    {
      path: '/go-live',
      name: 'go-live',
      component: () => import('@/pages/GoLivePage.vue'),
    },
    {
      path: '/watch/:liveId',
      name: 'watch',
      component: () => import('@/pages/WatchPage.vue'),
      props: true,
    },
  ],
});
