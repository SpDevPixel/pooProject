/// <reference types="vite/client" />
/* Vite 환경 변수와 CSS 파일의 TypeScript 타입 정보를 선언합니다. */

declare module "*.css";

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_KAKAO_MAP_KEY?: string;
  readonly VITE_KAKAO_REST_KEY?: string;
  readonly VITE_TMAP_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  kakao: any;
}
