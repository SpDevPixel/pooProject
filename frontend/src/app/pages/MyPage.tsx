/*
 * 파일 위치: src/app/pages/MyPage.tsx
 * 상위 폴더: src/app/pages (라우팅되는 페이지 화면)
 * 역할: 사용자 프로필, 등록한 화장실, 작성 리뷰를 확인하는 마이페이지입니다.
 */
import { useState, useEffect, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, MapPin, Star, Mail, LogOut, MessageSquare, Settings, Trash2, RefreshCw, Save } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useAuth } from "../contexts/AuthContext";
import type { Toilet } from "../types/toilet";
import { PasswordConfirmDialog } from "../components/PasswordConfirmDialog";
import { loginWithAnyIdentifier } from "../api/users";
import { deleteUserToilet, fetchUserToilets, updateUserToilet } from "../api/toilets";
import { toast } from "sonner";

interface Review {
  id: string;
  toiletId: string;
  toiletName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

type ToiletEditForm = {
  openTime: string;
  openTimeDetail: string;
  managingOrg: string;
  phoneNumber: string;
  wasteDisposal: string;
  emergencyBell: boolean;
  diaperTable: boolean;
  entranceCctv: boolean;
};

const toEditForm = (toilet: Toilet): ToiletEditForm => ({
  openTime: toilet.openTime ?? "",
  openTimeDetail: toilet.openTimeDetail ?? "",
  managingOrg: toilet.managingOrg ?? "",
  phoneNumber: toilet.phoneNumber ?? "",
  wasteDisposal: toilet.wasteDisposal ?? "",
  emergencyBell: toilet.hasEmergencyBell,
  diaperTable: toilet.hasDiaperTable,
  entranceCctv: toilet.hasEntranceCctv,
});

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
  const [userToilets, setUserToilets] = useState<Toilet[]>([]);
  const [isLoadingToilets, setIsLoadingToilets] = useState(false);
  const [toiletLoadError, setToiletLoadError] = useState<string | null>(null);
  const [deletingToiletId, setDeletingToiletId] = useState<string | null>(null);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [editForm, setEditForm] = useState<ToiletEditForm | null>(null);
  const [isSavingToilet, setIsSavingToilet] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.token) return;

    let isMounted = true;

    const loadUserToilets = async () => {
      setIsLoadingToilets(true);
      setToiletLoadError(null);

      try {
        const toilets = await fetchUserToilets(user.token);
        if (isMounted) {
          setUserToilets(toilets);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setToiletLoadError(
            error instanceof Error
              ? error.message
              : "등록한 화장실을 불러오지 못했습니다."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingToilets(false);
        }
      }
    };

    loadUserToilets();

    return () => {
      isMounted = false;
    };
  }, [user?.token]);

  if (!user) {
    return null;
  }

  const userReviews = getUserReviews(user.email);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleEditProfile = () => {
    setShowPasswordConfirm(true);
  };

  const handlePasswordConfirmed = async (password: string) => {
    await loginWithAnyIdentifier([user.userId], password);
    setShowPasswordConfirm(false);
    navigate("/edit-profile");
  };

  const handleRefreshUserToilets = async () => {
    if (!user.token) return;

    setIsLoadingToilets(true);
    setToiletLoadError(null);

    try {
      const toilets = await fetchUserToilets(user.token);
      setUserToilets(toilets);
    } catch (error) {
      console.error(error);
      setToiletLoadError(
        error instanceof Error
          ? error.message
          : "등록한 화장실을 불러오지 못했습니다."
      );
    } finally {
      setIsLoadingToilets(false);
    }
  };

  const handleOpenToiletDetail = (toilet: Toilet) => {
    setSelectedToilet(toilet);
    setEditForm(toEditForm(toilet));
  };

  const handleCloseToiletDetail = () => {
    if (isSavingToilet) return;
    setSelectedToilet(null);
    setEditForm(null);
  };

  const handleSaveToilet = async () => {
    if (!selectedToilet || !editForm) return;

    setIsSavingToilet(true);

    try {
      await updateUserToilet(
        selectedToilet.managementNo,
        {
          openTime: editForm.openTime,
          openTimeDetail: editForm.openTimeDetail,
          managingOrg: editForm.managingOrg,
          phoneNumber: editForm.phoneNumber,
          wasteDisposal: editForm.wasteDisposal,
          emergencyBell: editForm.emergencyBell,
          diaperTable: editForm.diaperTable,
          entranceCctv: editForm.entranceCctv,
        },
        user.token
      );

      const updatedToilet: Toilet = {
        ...selectedToilet,
        openTime: editForm.openTime || undefined,
        openTimeDetail: editForm.openTimeDetail || undefined,
        managingOrg: editForm.managingOrg || undefined,
        phoneNumber: editForm.phoneNumber || undefined,
        wasteDisposal: editForm.wasteDisposal || undefined,
        hasEmergencyBell: editForm.emergencyBell,
        hasDiaperTable: editForm.diaperTable,
        hasEntranceCctv: editForm.entranceCctv,
      };

      setUserToilets((current) =>
        current.map((toilet) =>
          toilet.managementNo === updatedToilet.managementNo ? updatedToilet : toilet
        )
      );
      setSelectedToilet(updatedToilet);
      toast.success("화장실 정보가 수정되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "화장실 정보 수정에 실패했습니다."
      );
    } finally {
      setIsSavingToilet(false);
    }
  };

  const handleDeleteToilet = async (toilet: Toilet, event: MouseEvent) => {
    event.stopPropagation();

    if (!window.confirm(`"${toilet.name}" 화장실을 삭제할까요?`)) {
      return;
    }

    setDeletingToiletId(toilet.managementNo);

    try {
      await deleteUserToilet(toilet.managementNo, user.token);
      setUserToilets((current) =>
        current.filter((item) => item.managementNo !== toilet.managementNo)
      );
      toast.success("등록한 화장실이 삭제되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "화장실 삭제에 실패했습니다."
      );
    } finally {
      setDeletingToiletId(null);
    }
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
                {toiletLoadError && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <span>{toiletLoadError}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshUserToilets}
                      disabled={isLoadingToilets}
                    >
                      <RefreshCw size={14} className="mr-2" />
                      다시 시도
                    </Button>
                  </div>
                )}

                {isLoadingToilets ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <RefreshCw size={36} className="mx-auto mb-4 animate-spin opacity-40" />
                    <p>등록한 화장실을 불러오는 중입니다.</p>
                  </div>
                ) : userToilets.length === 0 ? (
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
                      onClick={() => handleOpenToiletDetail(toilet)}
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
                        <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenToiletDetail(toilet);
                            }}
                            aria-label={`${toilet.name} 정보 보기`}
                          >
                            <MapPin size={16} className="text-blue-600" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(event) => handleDeleteToilet(toilet, event)}
                            disabled={deletingToiletId === toilet.managementNo}
                            aria-label={`${toilet.name} 삭제`}
                          >
                            {deletingToiletId === toilet.managementNo ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} className="text-red-500" />
                            )}
                          </Button>
                        </div>
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

      <Dialog open={!!selectedToilet} onOpenChange={(open) => !open && handleCloseToiletDetail()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{selectedToilet?.name}</DialogTitle>
            <DialogDescription>
              등록한 화장실 정보를 확인하고 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {selectedToilet && editForm && (
            <div className="space-y-5">
              <div className="rounded-lg border bg-gray-50 p-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-gray-900">주소</p>
                    <p className="text-muted-foreground">{selectedToilet.roadAddress}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-medium text-gray-900">위도</p>
                      <p className="text-muted-foreground">{selectedToilet.lat}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">경도</p>
                      <p className="text-muted-foreground">{selectedToilet.lng}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-open-time">운영 시간</Label>
                  <Input
                    id="edit-open-time"
                    value={editForm.openTime}
                    onChange={(event) =>
                      setEditForm({ ...editForm, openTime: event.target.value })
                    }
                    placeholder="예: 24시간, 09:00-18:00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-managing-org">관리기관</Label>
                  <Input
                    id="edit-managing-org"
                    value={editForm.managingOrg}
                    onChange={(event) =>
                      setEditForm({ ...editForm, managingOrg: event.target.value })
                    }
                    placeholder="예: 서울시 강남구청"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone-number">관리기관 연락처</Label>
                  <Input
                    id="edit-phone-number"
                    value={editForm.phoneNumber}
                    onChange={(event) =>
                      setEditForm({ ...editForm, phoneNumber: event.target.value })
                    }
                    placeholder="예: 02-1234-5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-waste-disposal">화장실 방식</Label>
                  <Input
                    id="edit-waste-disposal"
                    value={editForm.wasteDisposal}
                    onChange={(event) =>
                      setEditForm({ ...editForm, wasteDisposal: event.target.value })
                    }
                    placeholder="예: 수세식"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-open-time-detail">운영 시간 상세</Label>
                  <Textarea
                    id="edit-open-time-detail"
                    value={editForm.openTimeDetail}
                    onChange={(event) =>
                      setEditForm({ ...editForm, openTimeDetail: event.target.value })
                    }
                    placeholder="예: 연중무휴, 주말 휴무 등"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <h3 className="text-sm font-medium">시설 특징</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="edit-emergency-bell">비상벨</Label>
                    <Switch
                      id="edit-emergency-bell"
                      checked={editForm.emergencyBell}
                      onCheckedChange={(checked) =>
                        setEditForm({ ...editForm, emergencyBell: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="edit-diaper-table">기저귀 교환대</Label>
                    <Switch
                      id="edit-diaper-table"
                      checked={editForm.diaperTable}
                      onCheckedChange={(checked) =>
                        setEditForm({ ...editForm, diaperTable: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="edit-entrance-cctv">입구 CCTV</Label>
                    <Switch
                      id="edit-entrance-cctv"
                      checked={editForm.entranceCctv}
                      onCheckedChange={(checked) =>
                        setEditForm({ ...editForm, entranceCctv: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseToiletDetail} disabled={isSavingToilet}>
                  닫기
                </Button>
                <Button onClick={handleSaveToilet} disabled={isSavingToilet}>
                  {isSavingToilet ? (
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  저장
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
