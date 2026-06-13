/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LIVEKIT_URL: string;
  readonly VITE_TOKEN_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<
    Record<string, never>,
    Record<string, never>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >;
  export default component;
}
