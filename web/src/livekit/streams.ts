import { ref } from 'vue';
import type { StreamInfo } from './types';
import { livekitConfig } from './config';

function streamsEndpoint(): string {
  const base = livekitConfig.tokenServerUrl.replace(/\/$/, '');
  return base ? `${base}/streams` : '/streams';
}

export function useStreamList() {
  const streams = ref<StreamInfo[]>([]);
  const loading = ref(false);
  const error = ref('');

  async function refresh(): Promise<void> {
    loading.value = true;
    error.value = '';
    try {
      const res = await fetch(streamsEndpoint());
      if (!res.ok) {
        throw new Error(`Failed to load streams (${res.status})`);
      }
      const body = (await res.json()) as { streams: StreamInfo[] };
      streams.value = body.streams ?? [];
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      streams.value = [];
    } finally {
      loading.value = false;
    }
  }

  return { streams, loading, error, refresh };
}

export { livekitConfig };
