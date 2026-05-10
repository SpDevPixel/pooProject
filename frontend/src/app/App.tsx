/*
 * 파일 위치: src/app/App.tsx
 * 상위 폴더: src/app (앱 실행 구조와 화면 로직)
 * 역할: 전역 Provider와 Router, Toast 알림을 묶는 최상위 앱 컴포넌트입니다.
 */
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <RouterProvider router={router} />
        <Toaster />
      </FavoritesProvider>
    </AuthProvider>
  );
}