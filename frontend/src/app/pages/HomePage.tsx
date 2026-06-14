/*
 * 파일 위치: src/app/pages/HomePage.tsx
 * 상위 폴더: src/app/pages (라우팅되는 페이지 화면)
 * 역할: 메인 지도 화면 화장실 목록, 필터, 알림, 길 안내를 제공
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  AlertCircle,
  Bell,
  Heart,
  MapPin,
  Menu,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
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
import { searchKakaoLocations, type SearchLocation } from "../api/kakaoSearch";
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

const SEARCH_RADIUS_METERS = 1500;
const SEARCH_RESULT_LIMIT = 10;

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [isLoadingToilets, setIsLoadingToilets] = useState(true);
  const [toiletLoadError, setToiletLoadError] = useState<string | null>(null);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [requestNotifications, setRequestNotifications] = useState<ToiletRequestNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<TmapRouteResult | null>(null);
  const [currentLocation, setCurrentLocation] = useState<RoutePoint | null>(null);
  const [isStartingRoute, setIsStartingRoute] = useState(false);
  const [addressMarkerStatus, setAddressMarkerStatus] = useState<"idle" | "loading" | "complete">("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(null);
  const [searchLocationCandidates, setSearchLocationCandidates] = useState<SearchLocation[]>([]);
  const [mapFocusLocation, setMapFocusLocation] = useState<(SearchLocation & { key: number }) | null>(null);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    hasDisabledFacility: false,
    hasDiaperTable: false,
    hasEmergencyBell: false,
    hasEntranceCctv: false,
    isUserSubmitted: null,
  });

  // 화장실 목록 조회
  const loadToilets = useCallback(async () => {
    setIsLoadingToilets(true);
    setToiletLoadError(null);

    try {
      const loadedToilets = await fetchToilets();
      setToilets(loadedToilets);
    } catch (error) {
      console.error(error);
      setToilets([]);
      setToiletLoadError("화장실 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoadingToilets(false);
    }
  }, []);

  useEffect(() => {
    loadToilets();
  }, [loadToilets]);

  useEffect(() => {
    const searchState = location.state as
      | { searchQuery?: string; searchLocation?: SearchLocation }
      | null;

    if (!searchState?.searchLocation) return;

    setSearchQuery(searchState.searchQuery ?? searchState.searchLocation.label);
    setSearchLocation(searchState.searchLocation);
    setSearchLocationCandidates([searchState.searchLocation]);
    setMapFocusLocation({
      ...searchState.searchLocation,
      key: Date.now(),
    });
    setSelectedToilet(null);
    setIsDetailModalOpen(false);
    window.history.replaceState({}, document.title);
  }, [location.state]);

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

  useEffect(() => {
    const keyword = searchQuery.trim();
    if (!keyword) {
      setSearchLocation(null);
      setSearchLocationCandidates([]);
      setIsSearchingLocation(false);
      return;
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingLocation(true);

      try {
        const locations = await searchKakaoLocations(keyword);
        if (!isCancelled) {
          setSearchLocationCandidates(locations);
          setSearchLocation(locations[0] ?? null);
        }
      } catch (error) {
        console.error(error);
        if (!isCancelled) {
          setSearchLocationCandidates([]);
          setSearchLocation(null);
        }
      } finally {
        if (!isCancelled) {
          setIsSearchingLocation(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const visibleToilets = useMemo(() => {
    return toilets.filter((toilet) => {
      if (filters.hasDisabledFacility && !toilet.hasDisabledFacility) return false;
      if (filters.hasDiaperTable && !toilet.hasDiaperTable) return false;
      if (filters.hasEmergencyBell && !toilet.hasEmergencyBell) return false;
      if (filters.hasEntranceCctv && !toilet.hasEntranceCctv) return false;
      if (filters.isUserSubmitted !== null && toilet.isUserSubmitted !== filters.isUserSubmitted) {
        return false;
      }
      return true;
    });
  }, [filters, toilets]);

  // 검색 결과 목록 적용
  const filteredToilets = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    if (!keyword || !searchLocation) {
      return visibleToilets.filter((toilet) => {
        if (!keyword) return true;
        return `${toilet.name} ${toilet.roadAddress}`.toLowerCase().includes(keyword);
      });
    }

    const textMatches = visibleToilets.filter((toilet) =>
      `${toilet.name} ${toilet.roadAddress}`.toLowerCase().includes(keyword)
    );

    const nearbyToilets = visibleToilets
      .filter(hasValidToiletCoordinates)
      .map((toilet) => ({
        toilet,
        distance: getDistanceMeters(searchLocation, toilet),
      }))
      .filter(({ distance }) => distance <= SEARCH_RADIUS_METERS)
      .sort((a, b) => a.distance - b.distance)
      .map(({ toilet, distance }) => ({
        ...toilet,
        distance,
      }));

    const mergedToilets: Toilet[] = [...nearbyToilets];
    textMatches.forEach((textMatch) => {
      if (!mergedToilets.some((toilet) => toilet.managementNo === textMatch.managementNo)) {
        mergedToilets.push(textMatch);
      }
    });

    return mergedToilets.slice(0, SEARCH_RESULT_LIMIT);
  }, [hasValidToiletCoordinates, searchLocation, searchQuery, visibleToilets]);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];

    return filteredToilets
      .filter(hasValidToiletCoordinates)
      .slice(0, 6);
  }, [filteredToilets, searchQuery]);

  const handleSearchSubmit = useCallback(async () => {
    const keyword = searchQuery.trim();
    if (!keyword) return;

    setIsSearchingLocation(true);

    try {
      const location =
        searchLocation ??
        searchLocationCandidates[0] ??
        (await searchKakaoLocations(keyword))[0];

      if (!location) {
        toast.error("검색한 위치를 찾지 못했습니다.");
        return;
      }

      setSearchLocation(location);
      setMapFocusLocation({
        ...location,
        key: Date.now(),
      });
      setSelectedToilet(null);
      setIsDetailModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("검색한 위치로 이동하지 못했습니다.");
    } finally {
      setIsSearchingLocation(false);
    }
  }, [searchLocation, searchLocationCandidates, searchQuery]);

  const handleSearchLocationClick = useCallback((location: SearchLocation) => {
    setSearchLocation(location);
    setMapFocusLocation({
      ...location,
      key: Date.now(),
    });
    setSelectedToilet(null);
    setIsDetailModalOpen(false);
  }, []);

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

  // 선택 화장실 길 안내
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

    const candidates = visibleToilets.filter(hasValidToiletCoordinates);
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
  }, [isStartingRoute, visibleToilets]);

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
        toast.error("현재 위치 반경 300m 안에 화장실이 없습니다. 가까운 화장실 안내를 이용해주세요.");
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

  // 홈 화면 렌더링
  return (
    <div className="flex h-[100dvh] w-full max-w-full flex-col overflow-hidden bg-gray-50">
      <div className="bg-white border-b px-3 py-4 flex-shrink-0 shadow-sm sm:px-4">
        <div className="flex w-full min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-blue-700 sm:text-2xl">화장실 급할 때</h1>
            <p className="text-sm text-muted-foreground">
              {isLoadingToilets
                ? "화장실 정보를 불러오는 중입니다."
                : `${visibleToilets.length}개의 화장실을 찾았습니다.`}
            </p>
            {!isLoadingToilets && addressMarkerStatus === "loading" && (
              <p className="text-sm font-medium text-blue-600">
                화장실 마커를 표시하는 중입니다.
              </p>
            )}
          </div>
          <div className="hidden w-full min-w-0 flex-wrap items-center gap-2 lg:flex lg:w-auto lg:justify-end">
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
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="fixed right-3 top-3 z-50 h-10 w-10 shrink-0 bg-white shadow-sm lg:hidden"
                aria-label="메뉴 열기"
              >
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] px-4">
              <SheetHeader className="px-0">
                <SheetTitle>메뉴</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-2">
                {toiletLoadError && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      loadToilets();
                    }}
                    className="w-full justify-start gap-2"
                  >
                    <RefreshCw size={18} />
                    다시 불러오기
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleOpenNotifications();
                  }}
                  className="relative w-full justify-start gap-2"
                >
                  <Bell size={18} />
                  알림
                  {pendingNotificationCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                      {pendingNotificationCount}
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/notices");
                  }}
                  className="w-full justify-start gap-2"
                >
                  <Megaphone size={18} />
                  공지사항
                </Button>
                {user?.role === "ADMIN" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate("/admin");
                    }}
                    className="w-full justify-start gap-2"
                  >
                    <Shield size={18} />
                    관리자
                  </Button>
                )}
                <ToiletFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  triggerClassName="w-full justify-start gap-2"
                />
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate("/mypage");
                    }}
                    className="w-full justify-start gap-2"
                  >
                    <User size={18} />
                    마이페이지
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate("/auth");
                    }}
                    className="w-full justify-start gap-2"
                  >
                    <User size={18} />
                    로그인
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="h-full w-full min-w-0">
          {toiletLoadError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertCircle size={18} />
              {toiletLoadError}
            </div>
          )}
          <div className="grid h-full min-w-0 grid-rows-[1fr_auto] gap-0 overflow-hidden border bg-white shadow-sm lg:grid-cols-[120px_390px_1fr] lg:grid-rows-none">
            <nav className="order-2 grid grid-cols-4 gap-1 border-t bg-slate-50 p-1.5 lg:order-none lg:flex lg:h-full lg:flex-col lg:border-r lg:border-t-0 lg:p-2">
              <RailButton
                icon={Navigation}
                label="가까운 화장실 안내"
                active={isStartingRoute}
                onClick={handleNavigateToNearestToilet}
              />
              <RailButton
                icon={Star}
                label="평점 높은 화장실 안내"
                active={false}
                onClick={handleNavigateToTopRatedNearbyToilet}
              />
              <RailButton
                icon={Plus}
                label="화장실 등록"
                active={false}
                onClick={() => navigate("/register")}
              />
              <RailButton
                icon={Heart}
                label="즐겨찾기"
                active={false}
                onClick={() => navigate("/favorites")}
              />
            </nav>
            <aside className="hidden min-w-0 border-b bg-white lg:block lg:h-full lg:overflow-y-auto lg:border-b-0 lg:border-r">
              <div className="border-b p-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Search size={17} />
                  빠른 검색
                </label>
                <Input
                  value={searchQuery}
                  readOnly={typeof window !== "undefined" && window.innerWidth < 1024}
                  onFocus={() => {
                    if (window.innerWidth < 1024) {
                      navigate("/search", { state: { initialQuery: searchQuery } });
                    }
                  }}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      navigate("/search", { state: { initialQuery: searchQuery } });
                    }
                  }}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSearchSubmit();
                    }
                  }}
                  placeholder="장소, 역, 주소 검색"
                  className="h-11"
                />
              </div>

              <div className="space-y-4 p-4">
                {searchQuery.trim() && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {isSearchingLocation ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        위치를 찾는 중입니다.
                      </>
                    ) : searchLocation ? (
                      <>
                        <MapPin size={13} className="text-blue-600" />
                        {searchLocation.label} 근처 화장실
                      </>
                    ) : (
                      <>
                        <Search size={13} />
                        이름 또는 주소 검색 결과
                      </>
                    )}
                  </div>
                )}

                {searchLocationCandidates.length > 0 && (
                  <section className="hidden lg:block">
                    <h2 className="mb-2 text-sm font-semibold text-slate-900">위치 후보</h2>
                    <div className="space-y-2">
                      {searchLocationCandidates.map((location) => {
                        const isActive =
                          searchLocation?.label === location.label &&
                          searchLocation?.lat === location.lat &&
                          searchLocation?.lng === location.lng;

                        return (
                          <button
                            key={`${location.label}-${location.lat}-${location.lng}`}
                            type="button"
                            onClick={() => handleSearchLocationClick(location)}
                            className={`w-full rounded-md border px-3 py-2 text-left transition ${
                              isActive
                                ? "border-blue-300 bg-blue-50"
                                : "bg-white hover:border-blue-200 hover:bg-blue-50"
                            }`}
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="min-w-0 truncate text-sm font-medium text-slate-900">
                                {location.label}
                              </span>
                              {location.isSubwayStation && (
                                <span className="shrink-0 rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                                  지하철역
                                </span>
                              )}
                            </span>
                            <span className="mt-1 block truncate text-xs text-muted-foreground">
                              {location.address || location.category || "위치 정보"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {searchQuery.trim() && (
                  <section className="hidden lg:block">
                    <h2 className="mb-2 text-sm font-semibold text-slate-900">근처 화장실</h2>
                    <div className="overflow-hidden rounded-lg border bg-white">
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
                              {typeof toilet.distance === "number" && Number.isFinite(toilet.distance) && (
                                <span className="mt-1 block text-xs font-medium text-blue-600">
                                  약 {toilet.distance >= 1000 ? `${(toilet.distance / 1000).toFixed(1)}km` : `${Math.round(toilet.distance)}m`}
                                </span>
                              )}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          검색 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>

            </aside>

            <div className="relative order-1 h-full min-h-[360px] min-w-0 lg:order-none lg:min-h-0">
              <MapView
                toilets={visibleToilets}
                selectedToilet={selectedToilet}
                focusLocation={mapFocusLocation}
                activeRoute={activeRoute}
                currentLocation={currentLocation}
                onClearRoute={() => setActiveRoute(null)}
                onCurrentLocationChange={setCurrentLocation}
                onMarkerClick={handleToiletClick}
                onAddressMarkerStatusChange={setAddressMarkerStatus}
              />
              <button
                type="button"
                onClick={() => navigate("/search", { state: { initialQuery: searchQuery } })}
                className="absolute left-3 right-3 top-3 z-20 flex h-11 items-center gap-2 rounded-lg border bg-white/95 px-4 text-left text-sm text-slate-500 shadow-lg backdrop-blur lg:hidden"
              >
                <Search size={17} className="shrink-0 text-blue-600" />
                <span className="truncate">{searchQuery || "장소, 역, 주소 검색"}</span>
              </button>
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

interface RailButtonProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

function RailButton({
  icon: Icon,
  label,
  active,
  onClick,
}: RailButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 text-center text-[10px] font-medium leading-3 transition sm:text-[11px] lg:min-h-0 lg:gap-2 lg:px-3 lg:py-4 lg:text-xs ${
        active
          ? "bg-blue-600 text-white"
          : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
      }`}
    >
      <Icon size={19} className="shrink-0 lg:size-6" />
      <span className="break-keep">{label}</span>
    </button>
  );
}
