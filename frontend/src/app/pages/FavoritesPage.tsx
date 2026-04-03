import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Heart, MapPin, Star, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { useFavorites } from "../contexts/FavoritesContext";
import { mockToilets } from "../data/mockToilets";
import { ToiletDetailModal } from "../components/ToiletDetailModal";
import { Toilet } from "../types/toilet";
import { Badge } from "../components/ui/badge";

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);

  // Get favorite toilets
  const favoriteToilets = mockToilets.filter((toilet) =>
    favorites.includes(toilet.id)
  );

  const handleRemoveFavorite = (toiletId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(toiletId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <Heart className="fill-red-500 text-red-500" size={24} />
              <h1 className="text-xl font-semibold">즐겨찾기</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {favoriteToilets.length === 0 ? (
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
                  key={toilet.id}
                  onClick={() => setSelectedToilet(toilet)}
                  className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{toilet.name}</h3>
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

                      {/* Quick Info Badges */}
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
                      onClick={(e) => handleRemoveFavorite(toilet.id, e)}
                      className="flex-shrink-0 ml-2"
                    >
                      <Trash2 size={18} className="text-red-500" />
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

      {/* Toilet Detail Modal */}
      <ToiletDetailModal
        toilet={selectedToilet}
        open={!!selectedToilet}
        onClose={() => setSelectedToilet(null)}
      />
    </div>
  );
}