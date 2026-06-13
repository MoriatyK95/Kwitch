import { createRouter, createWebHistory } from 'vue-router';

/**
 * The core Twitch/Kick-style surfaces:
 *   /          Browse   — grid of live channels (fetchLiveList)
 *   /go-live   GoLive   — host: device select + StreamMixer + startLive
 *   /watch/:id Watch    — viewer: LiveView + joinLive + event handling
 *   /studio    Creator Studio — production controls and readiness
 *   /pk-arena  PK Arena — host-vs-host battle showcase
 *
 * Components are lazy-loaded so each page's SDK usage is code-split.
 */
export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0 };
  },
  routes: [
    {
      path: '/',
      name: 'browse',
      component: () => import('@/pages/BrowsePage.vue'),
      meta: { title: 'Browse' },
    },
    {
      path: '/go-live',
      name: 'go-live',
      component: () => import('@/pages/GoLivePage.vue'),
      meta: { title: 'Go Live' },
    },
    {
      path: '/studio',
      name: 'studio',
      component: () => import('@/pages/CreatorStudioPage.vue'),
      meta: { title: 'Creator Studio' },
    },
    {
      path: '/watch/:liveId',
      name: 'watch',
      component: () => import('@/pages/WatchPage.vue'),
      props: true,
      meta: { title: 'Watching' },
    },
    {
      path: '/pk-arena',
      name: 'pk-arena',
      component: () => import('@/pages/PkBattlePage.vue'),
      meta: { title: 'PK Arena' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
      meta: { title: 'Not Found' },
    },
  ],
});

router.afterEach((to) => {
  const title = to.meta.title as string | undefined;
  document.title = title ? `${title} · Kwitch` : 'Kwitch — Live Streaming';
});
