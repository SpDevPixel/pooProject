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

// 2. 카카오맵이 로드되기 전, 빈 화면 대신 보여줄 로딩 화면을 먼저 그립니다.
root.render(
  <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
    <h3>화장실 지도를 불러오는 중입니다. 잠시만 기다려주세요.</h3>
  </div>
);

const KAKAO_KEY = (import.meta as any).env.VITE_KAKAO_MAP_KEY;

if (!KAKAO_KEY) {
  root.render(
    <div style={{ color: "#b91c1c", textAlign: "center", marginTop: "50px" }}>
      <h3>지도를 불러올 수 없습니다</h3>
      <p>지도 설정이 아직 연결되지 않았습니다. 잠시 후 다시 시도해주세요.</p>
    </div>
  );
} else {
  const script = document.createElement("script");
  
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services,clusterer&autoload=false`;

  script.onload = () => {
    window.kakao.maps.load(() => {
      // 3. 스크립트 로드와 내부 초기화가 모두 끝나면, 드디어 진짜 App을 그립니다.
      root.render(
        <StrictMode>
          <App />
        </StrictMode>
      );
    });
  };

  script.onerror = () => {
    root.render(
      <div style={{ color: "#b91c1c", textAlign: "center", marginTop: "50px" }}>
        <h3>지도를 불러올 수 없습니다</h3>
        <p>인터넷 연결을 확인한 뒤 새로고침해주세요.</p>
      </div>
    );
  };

  document.head.appendChild(script);
}
