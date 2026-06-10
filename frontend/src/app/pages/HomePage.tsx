/*
 * 파일 위치: src/app/pages/HomePage.tsx
 * 상위 폴더: src/app/pages (라우팅되는 페이지 화면)
 * 역할: 메인 지도 화면입니다. 화장실 목록, 필터, 알림, 길 안내를 제공합니다.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  Bell,
  Heart,
  Megaphone,
  Navigation,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Star,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { ToiletFilters } from "../components/ToiletFilters";
import { ToiletDetailModal } from "../components/ToiletDetailModal";
import { MapView } from "../components/MapView";
import { fetchToilets } from "../api/toilets";
import {
  deleteToiletRequestNotification,
  getToiletRequests,
  type ToiletRequestNotification,
} from "../api/toiletRequests";
import {
  fetchPedestrianRoute,
  type RoutePoint,
  type TmapRouteResult,
} from "../api/tmapRoutes";
import { mockToilets } from "../data/mockToilets";
import type { Toilet, ToiletFilters as Filters } from "../types/toilet";
import { useAuth } from "../contexts/AuthContext";

const hasValidToiletCoordinates = (toilet: Toilet) =>
  typeof toilet.lat === "number" &&
  typeof toilet.lng === "number" &&
  Number.isFinite(toilet.lat) &&
  Number.isFinite(toilet.lng) &&
  toilet.lat >= -90 &&
  toilet.lat <= 90 &&
  toilet.lng >= -180 &&
  toilet.lng <= 180;

const getCurrentRoutePoint = (): Promise<RoutePoint> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("현재 브라우저에서 위치 정보를 사용할 수 없습니다."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === 1) {
          reject(new Error("위치 권한을 허용한 뒤 다시 시도해주세요."));
        } else {
          reject(new Error("현재 위치를 확인하지 못했습니다. 잠시 후 다시 시도해주세요."));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

const getDistanceMeters = (from: RoutePoint, toilet: Toilet) => {
  if (!hasValidToiletCoordinates(toilet)) return Number.POSITIVE_INFINITY;

  const earthRadius = 6371000;
  const fromLat = (from.lat * Math.PI) / 180;
  const toLat = ((toilet.lat as number) * Math.PI) / 180;
  const deltaLat = (((toilet.lat as number) - from.lat) * Math.PI) / 180;
  const deltaLng = (((toilet.lng as number) - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [isLoadingToilets, setIsLoadingToilets] = useState(true);
  const [toiletLoadError, setToiletLoadError] = useState<string | null>(null);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [requestNotifications, setRequestNotifications] = useState<ToiletRequestNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<TmapRouteResult | null>(null);
  const [currentLocation, setCurrentLocation] = useState<RoutePoint | null>(null);
  const [isStartingRoute, setIsStartingRoute] = useState(false);
  const [addressMarkerStatus, setAddressMarkerStatus] = useState<"idle" | "loading" | "complete">("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    hasDisabledFacility: false,
    hasDiaperTable: false,
    hasEmergencyBell: false,
    hasEntranceCctv: false,
    isUserSubmitted: null,
  });

  const loadToilets = useCallback(async () => {
    setIsLoadingToilets(true);
    setToiletLoadError(null);

    try {
      const loadedToilets = await fetchToilets();
      setToilets(loadedToilets);
    } catch (error) {
      console.error(error);
      setToilets(mockToilets);
      setToiletLoadError(
        "화장실 정보를 불러오지 못해 임시 데이터로 보여주고 있습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setIsLoadingToilets(false);
    }
  }, []);

  useEffect(() => {
    loadToilets();
  }, [loadToilets]);

  const loadRequestNotifications = useCallback(async () => {
    if (!user?.token) {
      setRequestNotifications([]);
      return;
    }

    setIsLoadingNotifications(true);
    setNotificationError(null);

    try {
      const requests = await getToiletRequests(user.token);
      setRequestNotifications(requests);
    } catch (error) {
      console.error(error);
      setNotificationError(
        error instanceof Error
          ? error.message
          : "요청 알림을 불러오지 못했습니다."
      );
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user?.token]);

  useEffect(() => {
    loadRequestNotifications();
  }, [loadRequestNotifications]);

  const filteredToilets = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return toilets.filter((toilet) => {
      if (filters.hasDisabledFacility && !toilet.hasDisabledFacility) return false;
      if (filters.hasDiaperTable && !toilet.hasDiaperTable) return false;
      if (filters.hasEmergencyBell && !toilet.hasEmergencyBell) return false;
      if (filters.hasEntranceCctv && !toilet.hasEntranceCctv) return false;
      if (filters.isUserSubmitted !== null && toilet.isUserSubmitted !== filters.isUserSubmitted) {
        return false;
      }
      if (keyword && !`${toilet.name} ${toilet.roadAddress}`.toLowerCase().includes(keyword)) {
        return false;
      }
      return true;
    });
  }, [filters, searchQuery, toilets]);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];

    return filteredToilets
      .filter(hasValidToiletCoordinates)
      .slice(0, 6);
  }, [filteredToilets, searchQuery]);

  const handleToiletClick = useCallback((toilet: Toilet) => {
    setSelectedToilet(toilet);
    setIsDetailModalOpen(true);
  }, []);

  const handleSearchSuggestionClick = useCallback((toilet: Toilet) => {
    setSelectedToilet(toilet);
    setIsDetailModalOpen(false);
  }, []);

  const handleReviewStatsChange = useCallback(
    (managementNo: string, rating: number, reviewCount: number) => {
      setToilets((current) =>
        current.map((toilet) =>
          toilet.managementNo === managementNo &&
          (toilet.rating !== rating || toilet.reviewCount !== reviewCount)
            ? { ...toilet, rating, reviewCount }
            : toilet
        )
      );

      setSelectedToilet((current) =>
        current?.managementNo === managementNo &&
        (current.rating !== rating || current.reviewCount !== reviewCount)
          ? { ...current, rating, reviewCount }
          : current
      );
    },
    []
  );

  const startRouteToToilet = useCallback(
    async (destination: Toilet, start?: RoutePoint) => {
      if (isStartingRoute) return;

      if (!hasValidToiletCoordinates(destination)) {
        toast.error("선택한 화장실의 좌표가 없어 길 안내를 시작할 수 없습니다.");
        return;
      }

      setIsStartingRoute(true);

      try {
        const routeStart = start ?? (await getCurrentRoutePoint());
        setCurrentLocation(routeStart);
        const route = await fetchPedestrianRoute({
          start: routeStart,
          destination,
        });

        setActiveRoute(route);
        setSelectedToilet(destination);
        setIsDetailModalOpen(false);
        toast.success(`${destination.name}까지 길 안내를 시작합니다.`);
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error
            ? error.message
            : "길 안내를 시작하지 못했습니다."
        );
      } finally {
        setIsStartingRoute(false);
      }
    },
    [isStartingRoute]
  );

  const handleNavigateToNearestToilet = useCallback(async () => {
    if (isStartingRoute) return;

    const candidates = filteredToilets.filter(hasValidToiletCoordinates);
    if (candidates.length === 0) {
      toast.error("길 안내할 수 있는 화장실 좌표가 없습니다.");
      return;
    }

    setIsStartingRoute(true);

    try {
      const start = await getCurrentRoutePoint();
      setCurrentLocation(start);
      const nearestToilet = [...candidates].sort(
        (a, b) => getDistanceMeters(start, a) - getDistanceMeters(start, b)
      )[0];
      const route = await fetchPedestrianRoute({
        start,
        destination: nearestToilet,
      });

      setActiveRoute(route);
      setSelectedToilet(nearestToilet);
      setIsDetailModalOpen(false);
      toast.success(`가장 가까운 ${nearestToilet.name}까지 길 안내를 시작합니다.`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "가장 가까운 화장실 경로를 찾지 못했습니다."
      );
    } finally {
      setIsStartingRoute(false);
    }
  }, [filteredToilets, isStartingRoute]);

  const handleNavigateToTopRatedNearbyToilet = useCallback(async () => {
    if (isStartingRoute) return;

    const candidates = toilets.filter(hasValidToiletCoordinates);

    if (candidates.length === 0) {
      toast.error("길 안내할 수 있는 화장실 좌표가 없습니다.");
      return;
    }

    setIsStartingRoute(true);

    try {
      const start = await getCurrentRoutePoint();
      setCurrentLocation(start);

      const nearbyToilets = candidates
        .map((toilet) => ({
          toilet,
          distance: getDistanceMeters(start, toilet),
        }))
        .filter(({ distance }) => distance <= 300);

      if (nearbyToilets.length === 0) {
        toast.error("현재 위치 반경 300m 안에 화장실이 없습니다.");
        return;
      }

      const topRatedToilet = [...nearbyToilets]
        .filter(
          ({ toilet }) =>
            typeof toilet.rating === "number" &&
            Number.isFinite(toilet.rating) &&
            toilet.rating > 0
        )
        .sort((a, b) => {
          const ratingDiff = (b.toilet.rating ?? 0) - (a.toilet.rating ?? 0);
          return ratingDiff !== 0 ? ratingDiff : a.distance - b.distance;
        })[0]?.toilet;

      const destination =
        topRatedToilet ??
        [...nearbyToilets].sort((a, b) => a.distance - b.distance)[0].toilet;

      if (!topRatedToilet) {
        toast.info("평점이 부여된 화장실이 없어 가장 가까운 화장실로 안내합니다.");
      }

      const route = await fetchPedestrianRoute({
        start,
        destination,
      });

      setActiveRoute(route);
      setSelectedToilet(destination);
      setIsDetailModalOpen(false);
      toast.success(`${destination.name}까지 길 안내를 시작합니다.`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "평점이 가장 높은 주변 화장실 경로를 찾지 못했습니다."
      );
    } finally {
      setIsStartingRoute(false);
    }
  }, [isStartingRoute, toilets]);

  const handleOpenNotifications = () => {
    if (!user?.token) {
      toast.error("로그인 후 요청 알림을 확인할 수 있습니다.");
      return;
    }

    setIsNotificationsOpen(true);
    loadRequestNotifications();
  };

  const handleDeleteRequestNotification = async (requestId: string) => {
    if (!user?.token) return;

    try {
      await deleteToiletRequestNotification(requestId, user.token);
      toast.success("요청 알림을 삭제했습니다.");
      await loadRequestNotifications();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "요청 삭제 처리에 실패했습니다."
      );
    }
  };

  const pendingNotificationCount = requestNotifications.length;
  const headerButtonClass =
    "min-w-[5.5rem] flex-1 basis-[30%] shrink justify-center gap-1 whitespace-nowrap px-2 text-xs sm:min-w-0 sm:flex-none sm:basis-auto sm:gap-2 sm:px-3 sm:text-sm";

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden flex flex-col bg-gray-50">
      <div className="bg-white border-b px-3 py-4 flex-shrink-0 shadow-sm sm:px-4">
        <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-blue-700 sm:text-2xl">화장실 급할 때</h1>
            <p className="text-sm text-muted-foreground">
              {isLoadingToilets
                ? "화장실 정보를 불러오는 중입니다."
                : `${filteredToilets.length}개의 화장실을 찾았습니다.`}
            </p>
            {!isLoadingToilets && addressMarkerStatus !== "idle" && (
              <p className="text-sm font-medium text-blue-600">
                {addressMarkerStatus === "loading"
                  ? "화장실 마커를 표시하는 중입니다."
                  : "화장실 마커 표시가 완료되었습니다."}
              </p>
            )}
          </div>
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
            {toiletLoadError && (
              <Button variant="outline" onClick={loadToilets} className={headerButtonClass}>
                <RefreshCw size={18} />
                다시 불러오기
              </Button>
            )}
            <Button variant="outline" onClick={handleOpenNotifications} className={`${headerButtonClass} relative`}>
              <Bell size={18} />
              알림
              {pendingNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                  {pendingNotificationCount}
                </span>
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate("/notices")} className={headerButtonClass}>
              <Megaphone size={18} />
              공지사항
            </Button>
            {user?.role === "ADMIN" && (
              <Button variant="outline" onClick={() => navigate("/admin")} className={headerButtonClass}>
                <Shield size={18} />
                관리자
              </Button>
            )}
            <ToiletFilters
              filters={filters}
              onFiltersChange={setFilters}
              triggerClassName={headerButtonClass}
            />
            {isAuthenticated ? (
              <Button
                variant="outline"
                onClick={() => navigate("/mypage")}
                className={headerButtonClass}
              >
                <User size={18} />
                마이페이지
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className={headerButtonClass}
              >
                <User size={18} />
                로그인
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden lg:overflow-hidden">
        <div className="mx-auto h-full w-full max-w-7xl min-w-0 p-3 sm:p-4">
          {toiletLoadError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertCircle size={18} />
              {toiletLoadError}
            </div>
          )}
          <div className="grid min-w-0 gap-4 lg:h-full lg:grid-cols-4">
            <div className="min-w-0 space-y-3 lg:col-span-1">
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Search size={17} />
                  빠른 검색
                </label>
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="화장실 이름 또는 주소"
                />
                {searchQuery.trim() && (
                  <div className="mt-3 overflow-hidden rounded-lg border bg-white">
                    {searchSuggestions.length > 0 ? (
                      searchSuggestions.map((toilet) => (
                        <button
                          key={toilet.managementNo}
                          type="button"
                          className="flex w-full items-start gap-2 border-b px-3 py-3 text-left last:border-b-0 hover:bg-blue-50"
                          onClick={() => handleSearchSuggestionClick(toilet)}
                        >
                          <Search size={15} className="mt-0.5 shrink-0 text-blue-600" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              {toilet.name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {toilet.roadAddress || "주소 정보 없음"}
                            </span>
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        검색 결과가 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <ActionButton
                icon={Navigation}
                label={isStartingRoute ? "경로 찾는 중" : "길찾기"}
                description="가까운 화장실로 경로 안내"
                color="blue"
                onClick={handleNavigateToNearestToilet}
              />
              <ActionButton
                icon={Star}
                label={isStartingRoute ? "추천 경로 찾는 중" : "평점 높은 화장실"}
                description="300m 안 평점 최고 화장실 안내"
                color="yellow"
                onClick={handleNavigateToTopRatedNearbyToilet}
              />
              <ActionButton
                icon={Plus}
                label="새 화장실 등록"
                description="화장실 정보 공유하기"
                color="green"
                onClick={() => navigate("/register")}
              />
              <ActionButton
                icon={Heart}
                label="즐겨찾기"
                description="저장한 화장실 보기"
                color="purple"
                onClick={() => navigate("/favorites")}
              />
            </div>

            <div className="min-w-0 h-[600px] lg:col-span-3 lg:h-full">
              <MapView
                toilets={filteredToilets}
                selectedToilet={selectedToilet}
                activeRoute={activeRoute}
                currentLocation={currentLocation}
                onClearRoute={() => setActiveRoute(null)}
                onCurrentLocationChange={setCurrentLocation}
                onMarkerClick={handleToiletClick}
                onAddressMarkerStatusChange={setAddressMarkerStatus}
              />
            </div>
          </div>
        </div>
      </div>

      <ToiletDetailModal
        toilet={selectedToilet}
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onStartNavigation={startRouteToToilet}
        isStartingNavigation={isStartingRoute}
        onReviewStatsChange={handleReviewStatsChange}
      />

      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle>요청 알림</DialogTitle>
            <DialogDescription>
              화장실 수정요청과 삭제요청을 확인합니다.
            </DialogDescription>
          </DialogHeader>

          {notificationError && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span>{notificationError}</span>
              <Button variant="outline" size="sm" onClick={loadRequestNotifications}>
                다시 시도
              </Button>
            </div>
          )}

          {isLoadingNotifications ? (
            <div className="rounded-lg border bg-gray-50 p-8 text-center text-sm text-muted-foreground">
              요청 알림을 불러오는 중입니다.
            </div>
          ) : requestNotifications.length === 0 ? (
            <div className="rounded-lg border bg-gray-50 p-8 text-center text-sm text-muted-foreground">
              아직 도착한 요청 알림이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {requestNotifications.map((request) => (
                <div key={request.id} className="rounded-lg border bg-white p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant={request.type === "UPDATE" ? "secondary" : "destructive"}>
                      {request.type === "UPDATE" ? "수정요청" : "삭제요청"}
                    </Badge>
                  </div>
                  <h3 className="font-semibold">{request.toiletName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{request.roadAddress}</p>
                  <p className="mt-3 rounded-md bg-gray-50 p-3 text-sm">{request.message}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>요청자: {request.requesterName}</span>
                      <span>아이디: {request.requesterUserId}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRequestNotification(request.id)}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  description: string;
  color: "blue" | "yellow" | "green" | "purple";
  onClick: () => void;
}

function ActionButton({
  icon: Icon,
  label,
  description,
  color,
  onClick,
}: ActionButtonProps) {
  const colorClasses = {
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    yellow: "bg-yellow-500 hover:bg-yellow-600 text-white",
    green: "bg-green-600 hover:bg-green-700 text-white",
    purple: "bg-purple-600 hover:bg-purple-700 text-white",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-6 rounded-lg ${colorClasses[color]} transition-all hover:shadow-lg text-left`}
    >
      <div className="flex flex-col items-start gap-2">
        <Icon size={32} className="mb-2" />
        <h3 className="font-bold text-lg">{label}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </button>
  );
}
