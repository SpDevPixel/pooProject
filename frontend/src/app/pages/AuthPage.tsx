/*
 * 파일 위치: src/app/pages/AuthPage.tsx
 * 상위 폴더: src/app/pages (라우팅되는 페이지 화면)
 * 역할: 로그인과 회원가입 흐름을 담당하는 인증 화면입니다.
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import { UserPlus, LogIn } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginData.username || !loginData.password) {
      toast.error("아이디와 비밀번호를 입력해주세요");
      return;
    }

    // Mock login - 실제로는 백엔드 API 호출
    // 아이디를 이메일처럼 사용 (데모용)
    const mockEmail = `${loginData.username}@example.com`;
    
    login(mockEmail, loginData.password)
      .then(() => {
        toast.success("로그인 성공!");
        navigate("/");
      })
      .catch(() => {
        toast.error("로그인 실패");
      });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !signupData.username ||
      !signupData.name ||
      !signupData.email ||
      !signupData.password
    ) {
      toast.error("필수 항목을 입력해주세요");
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }

    if (signupData.password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다");
      return;
    }

    // Mock signup - 실제로는 백엔드 API 호출
    toast.success("회원가입 완료! 로그인해주세요.");
    
    // 회원가입 후 로그인 탭으로 이동
    setActiveTab("login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-700 mb-2">화장실 급할 때</h1>
          <p className="text-muted-foreground">가까운 화장실을 빠르게 찾아보세요</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">아이디</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="아이디를 입력하세요"
                    value={loginData.username}
                    onChange={(e) =>
                      setLoginData({ ...loginData, username: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">비밀번호</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  <LogIn size={18} className="mr-2" />
                  로그인
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate("/")}
                    className="text-sm"
                  >
                    로그인 없이 둘러보기
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">
                    아이디 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="아이디를 입력하세요"
                    value={signupData.username}
                    onChange={(e) =>
                      setSignupData({ ...signupData, username: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-name">
                    이름 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={signupData.name}
                    onChange={(e) =>
                      setSignupData({ ...signupData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">
                    이메일 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="example@email.com"
                    value={signupData.email}
                    onChange={(e) =>
                      setSignupData({ ...signupData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-address">주소</Label>
                  <Input
                    id="signup-address"
                    type="text"
                    placeholder="주소를 입력하세요 (선택사항)"
                    value={signupData.address}
                    onChange={(e) =>
                      setSignupData({ ...signupData, address: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">
                    비밀번호 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="6자 이상 입력하세요"
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData({ ...signupData, password: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={signupData.confirmPassword}
                    onChange={(e) =>
                      setSignupData({
                        ...signupData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  <UserPlus size={18} className="mr-2" />
                  회원가입
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}