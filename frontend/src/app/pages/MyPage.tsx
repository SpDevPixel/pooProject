/*
 * 파일 위치: src/app/pages/MyPage.tsx
 * 상위 폴더: src/app/pages (라우팅되는 페이지 화면)
 * 역할: 사용자 프로필, 등록한 화장실, 작성 리뷰를 확인하는 마이페이지입니다.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, MapPin, Star, Mail, LogOut, MessageSquare, Settings } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { mockToilets } from "../data/mockToilets";
import type { Toilet } from "../types/toilet";
import { PasswordConfirmDialog } from "../components/PasswordConfirmDialog";
import { loginWithAnyIdentifier } from "../api/users";

interface Review {
  id: string;
  toiletId: string;
  toiletName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Mock 데이터 - 사용자가 등록한 화장실
const getUserToilets = (userEmail: string): Toilet[] => {
  // TODO: 실제 구현 시 백엔드 API 호출
  // const response = await fetch(`/api/toilets/user/${userEmail}`);
  // return await response.json();
  
  // Mock: isUserSubmitted가 true인 화장실들 반환
  return mockToilets.filter((toilet) => toilet.isUserSubmitted);
};

// Mock 데이터 - 사용자가 작성한 리뷰
const getUserReviews = (userEmail: string): Review[] => {
  // TODO: 실제 구현 시 백엔드 API 호출
  // const response = await fetch(`/api/reviews/user/${userEmail}`);
  // return await response.json();
  
  // Mock 리뷰 데이터
  return [
    {
      id: "1",
      toiletId: "1",
      toiletName: "강남역 공중화장실",
      rating: 5,
      comment: "매우 깨끗하고 관리가 잘 되어있습니다. 접근성도 좋아요!",
      createdAt: "2024-03-15",
    },
    {
      id: "2",
      toiletId: "2",
      toiletName: "서울시청 화장실",
      rating: 4,
      comment: "시설은 좋은데 가끔 사람이 많아서 대기시간이 있어요.",
      createdAt: "2024-03-10",
    },
    {
      id: "3",
      toiletId: "5",
      toiletName: "여의도공원 공중화장실",
      rating: 5,
      comment: "장애인 시설이 잘 갖춰져 있고 깨끗합니다.",
      createdAt: "2024-03-05",
    },
  ];
};

export default function MyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"toilets" | "reviews">("toilets");
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const userToilets = getUserToilets(user.email);
  const userReviews = getUserReviews(user.email);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleEditProfile = () => {
    setShowPasswordConfirm(true);
  };

  const handlePasswordConfirmed = async (password: string) => {
    await loginWithAnyIdentifier([user.id, user.email], password);
    setShowPasswordConfirm(false);
    navigate("/edit-profile");
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-xl font-semibold">마이페이지</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleEditProfile} className="hidden sm:flex">
                <Settings size={16} className="mr-2" />
                회원정보 수정
              </Button>
              <Button variant="outline" size="icon" onClick={handleEditProfile} className="sm:hidden">
                <Settings size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:flex">
                <LogOut size={16} className="mr-2" />
                로그아웃
              </Button>
              <Button variant="outline" size="icon" onClick={handleLogout} className="sm:hidden">
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* User Info Card */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail size={32} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{userToilets.length}</p>
              <p className="text-sm text-muted-foreground">등록한 화장실</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{userReviews.length}</p>
              <p className="text-sm text-muted-foreground">작성한 리뷰</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border">
          <div className="flex border-b">
            <button
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                activeTab === "toilets"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("toilets")}
            >
              등록한 화장실 ({userToilets.length})
            </button>
            <button
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                activeTab === "reviews"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("reviews")}
            >
              작성한 리뷰 ({userReviews.length})
            </button>
          </div>

          <div className="p-4">
            {activeTab === "toilets" && (
              <div className="space-y-3">
                {userToilets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin size={48} className="mx-auto mb-4 opacity-20" />
                    <p>등록한 화장실이 없습니다.</p>
                    <Button
                      className="mt-4"
                      onClick={() => navigate("/register")}
                    >
                      화장실 등록하기
                    </Button>
                  </div>
                ) : (
                  userToilets.map((toilet) => (
                    <div
                      key={toilet.managementNo}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate("/")}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{toilet.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {toilet.roadAddress}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {toilet.hasDisabledFacility && (
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                장애인시설
                              </span>
                            )}
                            {toilet.hasDiaperTable && (
                              <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                                기저귀교환대
                              </span>
                            )}
                            {toilet.hasEmergencyBell && (
                              <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded">
                                비상벨
                              </span>
                            )}
                            {toilet.hasEntranceCctv && (
                              <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                                CCTV
                              </span>
                            )}
                          </div>
                        </div>
                        <MapPin size={20} className="text-blue-600 flex-shrink-0 ml-4" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-3">
                {userReviews.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                    <p>작성한 리뷰가 없습니다.</p>
                    <p className="text-sm mt-2">
                      화장실을 이용한 후 리뷰를 남겨보세요.
                    </p>
                  </div>
                ) : (
                  userReviews.map((review) => (
                    <div
                      key={review.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{review.toiletName}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {review.createdAt}
                          </p>
                        </div>
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Confirm Dialog */}
      <PasswordConfirmDialog
        open={showPasswordConfirm}
        onOpenChange={setShowPasswordConfirm}
        onConfirm={handlePasswordConfirmed}
        title="비밀번호 확인"
        description="회원정보 수정을 위해 비밀번호를 입력해주세요."
      />
    </div>
  );
}
