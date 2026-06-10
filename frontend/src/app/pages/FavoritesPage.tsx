/*
 * 파일 위치: src/app/pages/FavoritesPage.tsx
 * 상위 폴더: src/app/pages (라우팅되는 페이지 화면)
 * 역할: 백엔드에 저장된 사용자의 즐겨찾기 화장실 목록을 표시하는 화면
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Heart, MapPin, RefreshCw, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { useFavorites } from "../contexts/FavoritesContext";
import { ToiletDetailModal } from "../components/ToiletDetailModal";
import type { Toilet } from "../types/toilet";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../contexts/AuthContext";

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    favoriteToilets,
    isLoadingFavorites,
    favoriteError,
    refreshFavorites,
    removeFavorite,
  } = useFavorites();
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [removingToiletId, setRemovingToiletId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [navigate, user]);

  if (!user) {
    return null;
  }

  const handleRemoveFavorite = async (toilet: Toilet, event: React.MouseEvent) => {
    event.stopPropagation();
    setRemovingToiletId(toilet.id);

    try {
      await removeFavorite(toilet);
      toast.success("즐겨찾기에서 제거되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "즐겨찾기 취소에 실패했습니다."
      );
    } finally {
      setRemovingToiletId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft size={20} />
              </Button>
              <div className="flex items-center gap-2">
                <Heart className="fill-red-500 text-red-500" size={24} />
                <h1 className="text-xl font-semibold">즐겨찾기</h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshFavorites}
              disabled={isLoadingFavorites}
            >
              <RefreshCw
                size={16}
                className={`mr-2 ${isLoadingFavorites ? "animate-spin" : ""}`}
              />
              새로고침
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {favoriteError && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>{favoriteError}</span>
            <Button variant="outline" size="sm" onClick={refreshFavorites}>
              다시 시도
            </Button>
          </div>
        )}

        {isLoadingFavorites ? (
          <div className="bg-white rounded-lg border p-12 text-center text-muted-foreground">
            <RefreshCw size={44} className="mx-auto mb-4 animate-spin opacity-40" />
            즐겨찾기를 불러오는 중입니다.
          </div>
        ) : favoriteToilets.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <Heart size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">
              즐겨찾기한 화장실이 없습니다
            </h2>
            <p className="text-muted-foreground mb-6">
              자주 가는 화장실을 즐겨찾기에 추가해보세요
            </p>
            <Button onClick={() => navigate("/")}>
              화장실 찾기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                총 {favoriteToilets.length}개의 즐겨찾기
              </p>
            </div>

            <div className="grid gap-4">
              {favoriteToilets.map((toilet) => (
                <div
                  key={toilet.backendId ?? toilet.id}
                  onClick={() => setSelectedToilet(toilet)}
                  className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="truncate font-semibold">{toilet.name}</h3>
                        {toilet.rating && (
                          <div className="flex items-center gap-1">
                            <Star
                              size={16}
                              className="fill-yellow-400 text-yellow-400"
                            />
                            <span className="text-sm font-medium">
                              {toilet.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{toilet.roadAddress}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {toilet.hasDisabledFacility && (
                          <Badge variant="outline">장애인 시설</Badge>
                        )}
                        {toilet.hasDiaperTable && (
                          <Badge variant="outline">기저귀 교환대</Badge>
                        )}
                        {toilet.hasEmergencyBell && (
                          <Badge variant="outline">비상벨</Badge>
                        )}
                        {toilet.hasEntranceCctv && (
                          <Badge variant="outline">CCTV</Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => handleRemoveFavorite(toilet, event)}
                      disabled={removingToiletId === toilet.id}
                      className="ml-2 flex-shrink-0"
                      aria-label={`${toilet.name} 즐겨찾기 삭제`}
                    >
                      {removingToiletId === toilet.id ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} className="text-red-500" />
                      )}
                    </Button>
                  </div>

                  {toilet.openTime && (
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                      운영 시간: {toilet.openTime}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ToiletDetailModal
        toilet={selectedToilet}
        open={!!selectedToilet}
        onClose={() => setSelectedToilet(null)}
      />
    </div>
  );
}
