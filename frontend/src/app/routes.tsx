/*
 * 파일 위치: src/app/routes.tsx
 * 상위 폴더: src/app (앱 실행 구조와 화면 로직)
 * 역할: 페이지 URL 경로와 각 화면 컴포넌트를 연결하는 라우터 설정 파일입니다.
 */
import { createBrowserRouter } from "react-router";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import AuthPage from "./pages/AuthPage";
import FavoritesPage from "./pages/FavoritesPage";
import MyPage from "./pages/MyPage";
import EditProfilePage from "./pages/EditProfilePage";
import NoticesPage from "./pages/NoticesPage";
import NoticeDetailPage from "./pages/NoticeDetailPage";
import ToiletListPage from "./pages/ToiletListPage";
import AdminPage from "./pages/AdminPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
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
    path: "/toilets",
    element: <ToiletListPage />,
  },
  {
    path: "/admin",
    element: <AdminPage />,
  },
]);
