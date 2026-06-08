<script setup lang="ts">
/**
 * Camera + microphone picker for the host.
 *
 * Powered by AtomicXCore's `useDeviceState`:
 *   - `openLocalCamera()` / `openLocalMicrophone()`  start capture (StreamMixer
 *                                                     auto-previews the camera)
 *   - `cameraList` / `microphoneList`                enumerated devices
 *   - `currentCamera` / `currentMicrophone`          active device
 *   - `setCurrentCamera({ deviceId })` / `setCurrentMicrophone({ deviceId })`
 *   - `updateVideoQuality({ quality })`              resolution control
 */
import { onMounted } from 'vue';
import { useDeviceState, VideoQuality } from 'tuikit-atomicx-vue3';

const {
  openLocalCamera,
  openLocalMicrophone,
  getCameraList,
  getMicrophoneList,
  cameraList,
  microphoneList,
  currentCamera,
  currentMicrophone,
  setCurrentCamera,
  setCurrentMicrophone,
  updateVideoQuality,
} = useDeviceState();

onMounted(async () => {
  // Opening the devices triggers the browser's camera/mic permission prompt.
  // This only works on a secure context (localhost or HTTPS).
  await openLocalMicrophone();
  await openLocalCamera();
  await getCameraList();
  await getMicrophoneList();
});

function onCamera(e: Event) {
  setCurrentCamera({ deviceId: (e.target as HTMLSelectElement).value });
}
function onMic(e: Event) {
  setCurrentMicrophone({ deviceId: (e.target as HTMLSelectElement).value });
}
function onQuality(e: Event) {
  updateVideoQuality({ quality: Number((e.target as HTMLSelectElement).value) as VideoQuality });
}
</script>

<template>
  <div class="devices">
    <label>
      Camera
      <select :value="currentCamera?.deviceId" @change="onCamera">
        <option v-for="c in cameraList" :key="c.deviceId" :value="c.deviceId">
          {{ c.deviceName }}
        </option>
      </select>
    </label>
    <label>
      Microphone
      <select :value="currentMicrophone?.deviceId" @change="onMic">
        <option v-for="m in microphoneList" :key="m.deviceId" :value="m.deviceId">
          {{ m.deviceName }}
        </option>
      </select>
    </label>
    <label>
      Quality
      <select :value="VideoQuality.Quality720P" @change="onQuality">
        <option :value="VideoQuality.Quality360P">360p</option>
        <option :value="VideoQuality.Quality540P">540p</option>
        <option :value="VideoQuality.Quality720P">720p</option>
        <option :value="VideoQuality.Quality1080P">1080p</option>
      </select>
    </label>
  </div>
</template>

<style scoped>
.devices {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-dim);
}
</style>
