/*
 * 파일 위치: src/app/contexts/AuthContext.tsx
 * 상위 폴더: src/app/contexts (전역 상태 Context)
 * 역할: 로그인 상태와 사용자 정보를 localStorage 기반으로 관리하는 인증 컨텍스트입니다.
 */
import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
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

  const login = async (email: string, password: string) => {
    // TODO: 실제 구현 시 백엔드 API 호출
    // const response = await fetch('/api/auth/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password })
    // });
    // const data = await response.json();
    
    // Mock 로그인 (데모용)
    const mockUser = {
      email,
      name: email.split("@")[0],
    };
    
    setUser(mockUser);
    localStorage.setItem("user", JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
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