// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// 1. root 요소를 먼저 잡고 렌더링 준비를 합니다.
const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);

// 2. 카카오맵이 로드되기 전, 빈 화면 대신 보여줄 로딩 화면을 먼저 그립니다.
root.render(
  <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
    <h3>화장실 지도를 불러오는 중입니다... 잠시만 기다려주세요 🚽</h3>
  </div>
);

// 💡 [변수명 주의] KAKAO_KEY (단수형)
// .env 파일의 변수명이 VITE_KAKAO_MAP_KEY 와 정확히 일치하는지 꼭 확인하세요.
const KAKAO_KEY = (import.meta as any).env.VITE_KAKAO_MAP_KEY;

if (!KAKAO_KEY) {
  // API 키가 없을 때의 에러 화면
  root.render(
    <div style={{ color: "red", textAlign: "center", marginTop: "50px" }}>
      <h3>API 키 오류</h3>
      <p>.env 파일에 VITE_KAKAO_MAP_KEY가 없습니다.</p>
    </div>
  );
} else {
  const script = document.createElement("script");
  
  // 💡 [파라미터 주의] libraries=services (두 단어 모두 복수형 's'가 붙습니다)
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services&autoload=false`;

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
    // 4. 스크립트 다운로드 자체를 실패했을 때의 에러 화면 (네트워크/도메인 문제)
    root.render(
      <div style={{ color: "red", textAlign: "center", marginTop: "50px" }}>
        <h3>카카오 맵 로드 실패 ❌</h3>
        <p>인터넷 연결을 확인하거나, 카카오 디벨로퍼스에 http://localhost:5173 도메인이 등록되었는지 확인하세요.</p>
      </div>
    );
  };

  document.head.appendChild(script);
}