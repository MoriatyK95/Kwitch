<script setup lang="ts">
import { onMounted, ref } from 'vue';

const emit = defineEmits<{
  'devices-changed': [cameraId: string | undefined, micId: string | undefined];
}>();

const cameraList = ref<MediaDeviceInfo[]>([]);
const microphoneList = ref<MediaDeviceInfo[]>([]);
const currentCamera = ref('');
const currentMicrophone = ref('');
const quality = ref('720');

async function loadDevices() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    /* user may deny — still try enumerate */
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  cameraList.value = devices.filter((d) => d.kind === 'videoinput');
  microphoneList.value = devices.filter((d) => d.kind === 'audioinput');
  if (!currentCamera.value && cameraList.value[0]) {
    currentCamera.value = cameraList.value[0].deviceId;
  }
  if (!currentMicrophone.value && microphoneList.value[0]) {
    currentMicrophone.value = microphoneList.value[0].deviceId;
  }
  emit('devices-changed', currentCamera.value || undefined, currentMicrophone.value || undefined);
}

onMounted(loadDevices);

function onCamera(e: Event) {
  currentCamera.value = (e.target as HTMLSelectElement).value;
  emit('devices-changed', currentCamera.value || undefined, currentMicrophone.value || undefined);
}

function onMic(e: Event) {
  currentMicrophone.value = (e.target as HTMLSelectElement).value;
  emit('devices-changed', currentCamera.value || undefined, currentMicrophone.value || undefined);
}
</script>

<template>
  <div class="devices">
    <label>
      Camera
      <select :value="currentCamera" @change="onCamera">
        <option v-for="c in cameraList" :key="c.deviceId" :value="c.deviceId">
          {{ c.label || `Camera ${c.deviceId.slice(0, 8)}` }}
        </option>
      </select>
    </label>
    <label>
      Microphone
      <select :value="currentMicrophone" @change="onMic">
        <option v-for="m in microphoneList" :key="m.deviceId" :value="m.deviceId">
          {{ m.label || `Mic ${m.deviceId.slice(0, 8)}` }}
        </option>
      </select>
    </label>
    <label>
      Quality
      <select v-model="quality">
        <option value="360">360p</option>
        <option value="540">540p</option>
        <option value="720">720p</option>
        <option value="1080">1080p</option>
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
