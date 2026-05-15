/*
 * 파일 위치: src/app/contexts/AuthContext.tsx
 * 상위 폴더: src/app/contexts (전역 상태 Context)
 * 역할: 로그인 상태와 사용자 정보를 localStorage 기반으로 관리하는 인증 컨텍스트입니다.
 */
import { createContext, useContext, useState, ReactNode } from "react";
import { fetchMyInfo, loginUser } from "../api/users";

interface User {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (id: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; password?: string }) => void;
  deleteAccount: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // 로컬 스토리지에서 사용자 정보 복원
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (id: string, password: string) => {
    const { token } = await loginUser({ id, password });

    const userInfo = await fetchMyInfo(token).catch(() => null);
    const loggedInUser: User = {
      id: userInfo?.id ?? id,
      email: userInfo?.email ?? "",
      name: userInfo?.name ?? id,
      role: userInfo?.role,
      token,
    };

    setUser(loggedInUser);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const updateProfile = (data: { name?: string; password?: string }) => {
    if (!user) return;

    // TODO: 실제 구현 시 백엔드 API 호출
    // const response = await fetch('/api/user/update', {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });

    const updatedUser = {
      ...user,
      ...(data.name && { name: data.name }),
    };

    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const deleteAccount = () => {
    // TODO: 실제 구현 시 백엔드 API 호출
    // await fetch('/api/user/delete', {
    //   method: 'DELETE',
    // });

    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateProfile,
        deleteAccount,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
