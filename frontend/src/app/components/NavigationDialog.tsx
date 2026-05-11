/*
 * 파일 위치: src/app/components/NavigationDialog.tsx
 * 상위 폴더: src/app/components (화면에서 재사용하는 컴포넌트)
 * 역할: 선택한 화장실까지의 경로 안내 옵션을 보여주는 다이얼로그입니다.
 */
import { useState, useEffect } from "react";
import { Navigation, Star, MapPin, Clock, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { RouteType, Toilet } from "../types/toilet";

interface NavigationDialogProps {
  open: boolean;
  onClose: () => void;
  toilets: Toilet[];
}

export function NavigationDialog({
  open,
  onClose,
  toilets,
}: NavigationDialogProps) {
  const [selectedRouteType, setSelectedRouteType] = useState<RouteType | null>(
    null
  );

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedRouteType(null);
    }
  }, [open]);

  // Calculate mock distances based on current location (mock: 강남역)
  const currentLat = 37.4979;
  const currentLng = 127.0276;

  const toiletsWithDistance = toilets
    .filter((toilet) => toilet.lat !== null && toilet.lng !== null)
    .map((toilet) => {
      // Simple distance calculation (mock)
      const latDiff = toilet.lat! - currentLat;
      const lngDiff = toilet.lng! - currentLng;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000; // rough conversion to meters
      const estimatedTime = Math.ceil(distance / 80); // ~80m/min walking speed

      return {
        ...toilet,
        distance: Math.round(distance),
        estimatedTime,
      };
    })
    .filter((toilet) => toilet.distance < 2000); // Only show toilets within 2km

  // Get routes based on selection
  const optimalRoute = [...toiletsWithDistance].sort(
    (a, b) => a.distance - b.distance
  )[0];

  const highRatedRoute = [...toiletsWithDistance]
    .filter((t) => t.rating && t.rating >= 4.0)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

  const getRouteDestination = () => {
    if (selectedRouteType === "optimal") return optimalRoute;
    if (selectedRouteType === "highRated") return highRatedRoute;
    return null;
  };

  const handleStartNavigation = () => {
    const destination = getRouteDestination();
    if (!destination) return;

    // In a real app, this would open navigation app or show route on map
    alert(
      `길찾기 시작!\n목적지: ${destination.name}\n주소: ${destination.roadAddress}\n거리: ${destination.distance}m\n예상 시간: ${destination.estimatedTime}분`
    );
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="text-blue-600" size={24} />
            길찾기
          </DialogTitle>
          <DialogDescription>
            가까운 화장실까지의 최적 경로를 선택하세요
          </DialogDescription>
        </DialogHeader>

        {!selectedRouteType ? (
          // Route type selection
          <div className="space-y-4 py-4">
            <h3 className="font-medium">경로 유형 선택</h3>

            {/* Optimal Route Option */}
            {optimalRoute && (
              <button
                onClick={() => setSelectedRouteType("optimal")}
                className="w-full p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="text-blue-600" size={20} />
                      <span className="font-semibold">최적 경로</span>
                      <Badge variant="secondary">가장 가까움</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">
                        {optimalRoute.name}
                      </p>
                      <p>{optimalRoute.roadAddress}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          도보 {optimalRoute.estimatedTime}분
                        </span>
                        <span>{optimalRoute.distance}m</span>
                        {optimalRoute.rating && (
                          <span className="flex items-center gap-1">
                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                            {optimalRoute.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </button>
            )}

            {/* High Rated Route Option */}
            {highRatedRoute && (
              <button
                onClick={() => setSelectedRouteType("highRated")}
                className="w-full p-4 border-2 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="text-yellow-500 fill-yellow-500" size={20} />
                      <span className="font-semibold">평점 높은 순</span>
                      <Badge variant="secondary">높은 평점</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">
                        {highRatedRoute.name}
                      </p>
                      <p>{highRatedRoute.roadAddress}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          도보 {highRatedRoute.estimatedTime}분
                        </span>
                        <span>{highRatedRoute.distance}m</span>
                        {highRatedRoute.rating && (
                          <span className="flex items-center gap-1 font-semibold text-yellow-600">
                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                            {highRatedRoute.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </button>
            )}

            {!optimalRoute && !highRatedRoute && (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin size={48} className="mx-auto mb-2 opacity-20" />
                <p>주변 2km 이내에 화장실이 없습니다</p>
              </div>
            )}
          </div>
        ) : (
          // Selected route details
          <div className="space-y-4 py-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedRouteType(null)}
              className="mb-2"
            >
              ← 뒤로
            </Button>

            {(() => {
              const destination = getRouteDestination();
              if (!destination) return null;

              return (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      {selectedRouteType === "optimal" ? (
                        <MapPin className="text-blue-600" size={24} />
                      ) : (
                        <Star className="text-yellow-500 fill-yellow-500" size={24} />
                      )}
                      <h3 className="font-semibold">
                        {selectedRouteType === "optimal"
                          ? "최적 경로"
                          : "평점 높은 순"}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">목적지</p>
                        <p className="font-medium">{destination.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">주소</p>
                        <p className="text-sm">{destination.roadAddress}</p>
                      </div>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1">
                          <Clock size={16} className="text-muted-foreground" />
                          <span className="text-sm font-medium">
                            도보 {destination.estimatedTime}분
                          </span>
                        </div>
                        <div className="text-sm font-medium">
                          {destination.distance}m
                        </div>
                        {destination.rating && (
                          <div className="flex items-center gap-1">
                            <Star
                              size={16}
                              className="fill-yellow-400 text-yellow-400"
                            />
                            <span className="text-sm font-medium">
                              {destination.rating}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">시설 정보</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {destination.hasDisabledFacility && (
                        <Badge variant="outline">장애인 시설</Badge>
                      )}
                      {destination.hasDiaperTable && (
                        <Badge variant="outline">기저귀 교환대</Badge>
                      )}
                      {destination.hasEmergencyBell && (
                        <Badge variant="outline">비상벨</Badge>
                      )}
                      {destination.hasEntranceCctv && (
                        <Badge variant="outline">CCTV</Badge>
                      )}
                    </div>
                  </div>

                  {destination.openTime && (
                    <div>
                      <p className="text-sm text-muted-foreground">운영 시간</p>
                      <p className="text-sm">{destination.openTime}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleStartNavigation}
                    className="w-full"
                    size="lg"
                  >
                    <Navigation size={20} className="mr-2" />
                    길찾기 시작
                  </Button>
                </div>
              );
            })()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
