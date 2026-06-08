<script setup lang="ts">
/**
 * A loud, always-visible warning shown whenever the app is running in the
 * insecure client-side-signing dev mode. The whole point is that a learner
 * can never forget which mode they're in or accidentally ship `local` mode.
 */
import { isLocalSigMode } from '@/trtc';
</script>

<template>
  <div v-if="isLocalSigMode" class="dev-banner">
    ⚠️ <strong>DEV MODE</strong> — UserSig is signed in your browser using your
    SDKSecretKey. This is <strong>insecure</strong> and for local development
    only. Switch to <code>VITE_USERSIG_MODE=server</code> before deploying.
  </div>
</template>

<style scoped>
.dev-banner {
  background: repeating-linear-gradient(
    45deg,
    #3a2a00,
    #3a2a00 12px,
    #332500 12px,
    #332500 24px
  );
  color: #ffd479;
  border-bottom: 1px solid #5a4200;
  padding: 8px 16px;
  font-size: 13px;
  text-align: center;
}
.dev-banner code {
  background: rgba(0, 0, 0, 0.35);
  padding: 1px 5px;
  border-radius: 4px;
}
</style>
