/// <reference types="vite/client" />

declare module "*.css";

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_KAKAO_MAP_KEY?: string;
  readonly VITE_KAKAO_REST_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  kakao: {
    maps: {
      load: (callback: () => void) => void;
    };
  };
}
