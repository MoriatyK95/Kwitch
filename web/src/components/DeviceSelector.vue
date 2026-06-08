<script setup lang="ts">
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
        <option v-for="c in cameraList" :key="c.deviceId" :value="c.deviceId">{{ c.deviceName }}</option>
      </select>
    </label>
    <label>
      Microphone
      <select :value="currentMicrophone?.deviceId" @change="onMic">
        <option v-for="m in microphoneList" :key="m.deviceId" :value="m.deviceId">{{ m.deviceName }}</option>
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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-4);
}

label {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-dim);
}

select {
  height: 40px;
}
</style>
