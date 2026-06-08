# Features ↔ TRTC API map

Every Twitch/Kick-style feature in this demo, the file that implements it, and
the exact AtomicXCore state hook / component / event it uses. This is the
"Rosetta Stone" between the product and the SDK.

| Feature | UI file | TRTC API (`tuikit-atomicx-vue3`) | Key calls |
|---|---|---|---|
| **Login** (gate before all else) | `App.vue` → `src/trtc/login.ts` | `useLoginState` | `login({ sdkAppId, userId, userSig })` |
| **Credential abstraction** | `src/trtc/userSig.ts` | — (ours) + `genTestUserSig.ts` | `getUserSig(userId)` switches local/server |
| **Channel browse / discovery** | `pages/BrowsePage.vue` | `useLiveListState` | `fetchLiveList({ cursor, count })`, `liveList` |
| **Go Live — device select** | `components/DeviceSelector.vue` | `useDeviceState` | `openLocalCamera()`, `openLocalMicrophone()`, `cameraList`, `setCurrentCamera()`, `updateVideoQuality()` |
| **Go Live — preview canvas** | `pages/GoLivePage.vue` | `StreamMixer` (component) | renders host preview/output |
| **Go Live — start/stop** | `pages/GoLivePage.vue` | `useLiveListState` | `startLive({ liveId, liveName, isGiftEnabled, isLikeEnabled })`, `endLive()` |
| **Watch — video canvas** | `pages/WatchPage.vue` | `LiveView` (component) | auto-plays host stream |
| **Watch — join/leave** | `pages/WatchPage.vue` | `useLiveListState` | `joinLive({ liveId })`, `leaveLive()` |
| **Watch — graceful end/kick** | `pages/WatchPage.vue` | `useLiveListState` events | `subscribeEvent(LiveListEvent.onLiveEnded …)`, `subscribeEvent(LiveListEvent.onKickedOutOfLive …)` |
| **Live chat / barrage** | `components/LiveChat.vue` | `useBarrageState` | `messageList`, `sendTextMessage({ text })` |
| **Viewer count + list** | `components/ViewerList.vue` | `useLiveAudienceState` | `audienceCount`, `audienceList`, `fetchAudienceList()` |
| **Likes** | `components/GiftBar.vue` | `useLiveGiftState` | `sendLikes({ count })`, `totalLikeCount` |
| **Gifts** | `components/GiftBar.vue` | `useLiveGiftState` | `giftInfoList`, `refreshGiftList()`, `sendGift({ giftId, count })` |
| **Guest star / co-guest** | `components/CoGuestPanel.vue` | `useCoGuestState` | viewer: `applyForSeat({ seatIndex, timeout })`, `cancelApplication()`; host: `applicants`, `acceptApplication({ userId })`, `rejectApplication({ userId })` |
| **Host PK / raid (co-host)** | `components/CoHostPanel.vue` | `useCoHostState` | `getCoHostCandidates(cursor)`, `requestHostConnection({ liveId, layoutTemplate, timeout, extensionInfo })`, `acceptHostConnection({ liveId })`, `exitHostConnection()`, `connected` |
| **Server UserSig (prod)** | `server/src/index.ts` | `tls-sig-api-v2` (Node) | `new Api(appId, key).genSig(userId, expire)` |

## API reference links

- Live SDK overview (Core SDK): <https://trtc.io/document/live-overview?product=live&menulabel=core%20sdk&platform=web>
- Web Core SDK get-started (AtomicXCore): <https://trtc.io/document/74840>
- Web Core SDK API reference (all the state modules above): <https://web.sdk.qcloud.com/trtc/live/web/doc/en/index.html>
- Secure authentication with UserSig: <https://trtc.io/document/35166>
- Official Vue 3 example / LiveView component: <https://github.com/Tencent-RTC/TUIKit_Vue3>
- Server-side UserSig (Node): <https://github.com/Tencent-RTC/tls-sig-api-v2-node> (published on npm as **`tls-sig-api-v2`**)

## Notes & gotchas discovered while building

- **`startLive` vs `createLive`**: the get-started docs show `createLive`, but in
  `tuikit-atomicx-vue3@6.0.0` that method is marked `@deprecated` in favor of
  **`startLive`** (same params). We use `startLive`.
- **Gifts need Console config**: `giftInfoList` only populates if you've
  configured a gift list in the TRTC Console. The Like button needs no config,
  so engagement still works out of the box.
- **CSS is auto-imported**: the SDK imports its own stylesheet from its entry
  module. Do **not** add a manual `import 'tuikit-atomicx-vue3/dist/styles/…'` —
  the package's `exports` map blocks deep CSS imports and the build will fail.
- **Co-guest seat index**: `applyForSeat({ seatIndex: -1 })` requests any free
  seat; pass a specific index to target a slot.
