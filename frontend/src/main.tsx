/*
 * 파일 위치: src/main.tsx
 * 상위 폴더: src (프론트엔드 소스 루트)
 * 역할: 앱 시작점입니다. 카카오맵 SDK를 먼저 로드한 뒤 React 앱을 렌더링합니다.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";

// 1. root 요소를 먼저 잡고 렌더링 준비를 합니다.
const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);

const renderApp = () => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

const KAKAO_KEY = (import.meta as any).env.VITE_KAKAO_MAP_KEY;

if (!KAKAO_KEY) {
  window.dispatchEvent(new Event("kakao-maps-load-error"));
} else {
  const script = document.createElement("script");
  
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services,clusterer&autoload=false`;

  script.onload = () => {
    window.kakao.maps.load(() => {
      window.dispatchEvent(new Event("kakao-maps-loaded"));
    });
  };

  script.onerror = () => {
    window.dispatchEvent(new Event("kakao-maps-load-error"));
  };

  document.head.appendChild(script);
}

renderApp();
