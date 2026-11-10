/*
 * 파일 위치: src/app/routes.tsx
 * 상위 폴더: src/app (앱 실행 구조와 화면 로직)
 * 역할: 페이지 URL 경로와 각 화면 컴포넌트를 연결 라우터 설정 파일
 */
import { useEffect } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import AuthPage from "./pages/AuthPage";
import FavoritesPage from "./pages/FavoritesPage";
import MyPage from "./pages/MyPage";
import EditProfilePage from "./pages/EditProfilePage";
import NoticesPage from "./pages/NoticesPage";
import NoticeDetailPage from "./pages/NoticeDetailPage";
import AdminPage from "./pages/AdminPage";
import SearchPage from "./pages/SearchPage";

function RegisterRoute() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("로그인 후 화장실을 등록할 수 있습니다.", {
        id: "register-login-required",
      });
    }
  }, [isAuthenticated]);

  return isAuthenticated ? <RegisterPage /> : <Navigate to="/auth" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/register",
    element: <RegisterRoute />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/favorites",
    element: <FavoritesPage />,
  },
  {
    path: "/mypage",
    element: <MyPage />,
  },
  {
    path: "/edit-profile",
    element: <EditProfilePage />,
  },
  {
    path: "/notices",
    element: <NoticesPage />,
  },
  {
    path: "/notices/:noticeId",
    element: <NoticeDetailPage />,
  },
  {
    path: "/admin",
    element: <AdminPage />,
  },
  {
    path: "/search",
    element: <SearchPage />,
  },
]);
