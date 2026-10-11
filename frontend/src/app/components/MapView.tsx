/*
 * 파일 위치: src/app/components/MapView.tsx
 * 상위 폴더: src/app/components (화면에서 재사용하는 컴포넌트)
 * 역할: 카카오맵을 렌더링, 좌표가 있는 화장실 마커와 현재 위치 표시를 관리
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Navigation, X } from "lucide-react";
import type { Toilet } from "../types/toilet";
import type { RoutePoint, TmapRouteResult } from "../api/tmapRoutes";
import { Button } from "./ui/button";
import selectedToiletMarkerUrl from "../../assets/selected-toilet-marker.svg";
import { useLiveLocation } from "../hooks/useLiveLocation";
import type { LiveLocation } from "../utils/locationTracking";
import { advanceRouteProgress, createRouteGeometry, distanceBetween, getRemainingPath } from "../utils/routeProgress";
import { focusMapAt } from "../utils/mapViewport";

interface MapViewProps {
  toilets: Toilet[];
  selectedToilet: Toilet | null;
  focusLocation?: (RoutePoint & { key?: number }) | null;
  activeRoute?: TmapRouteResult | null;
  currentLocation?: RoutePoint | null;
  onClearRoute?: () => void;
  onCurrentLocationChange?: (location: LiveLocation) => void;
  onMarkerClick: (toilet: Toilet) => void;
  onAddressMarkerStatusChange?: (status: "loading" | "complete") => void;
}

export function MapView({
  toilets,
  selectedToilet,
  focusLocation,
  activeRoute,
  currentLocation,
  onClearRoute,
  onCurrentLocationChange,
  onMarkerClick,
  onAddressMarkerStatusChange,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markerClustererRef = useRef<any>(null);
  const clusterClickHandlerRef = useRef<((cluster: any) => void) | null>(null);
  const currentLocationMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const routeBasePolylineRef = useRef<any>(null);
  const routeStartOverlayRef = useRef<any>(null);
  const routeEndOverlayRef = useRef<any>(null);
  const { location: liveLocation, error: locationError, isLocating, retry: retryLocation } = useLiveLocation(onCurrentLocationChange);
  const [isFollowingLocation, setIsFollowingLocation] = useState(true);
  const followingLocationRef = useRef(true);
  const setFollowingLocation = useCallback((following: boolean) => {
    followingLocationRef.current = following;
    setIsFollowingLocation(following);
  }, []);
  const handleMarkerSelection = useCallback((toilet: Toilet) => {
    setFollowingLocation(false);
    onMarkerClick(toilet);
  }, [onMarkerClick, setFollowingLocation]);
  const [routeProgress, setRouteProgress] = useState(0);
  const routeProgressRef = useRef(0);
  const previousRouteLocationRef = useRef<LiveLocation | null>(null);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const visibleCurrentLocation = liveLocation ?? currentLocation;
  const routeGeometry = useMemo(() => createRouteGeometry(activeRoute?.path ?? []), [activeRoute]);
  const remainingFraction = routeGeometry.length > 0 ? Math.max(0, 1 - routeProgress / routeGeometry.length) : 1;
  const remainingDistance = (activeRoute?.distance ?? 0) * remainingFraction;
  const remainingDuration = (activeRoute?.duration ?? 0) * remainingFraction;
  const hasArrived = Boolean(activeRoute && routeGeometry.length > 0 && routeProgress >= routeGeometry.length);

  const routeDistanceText = activeRoute
    ? `${remainingDistance >= 1000 ? `${(remainingDistance / 1000).toFixed(1)}km` : `${Math.round(remainingDistance)}m`}`
    : "";
  const routeTimeText = activeRoute?.duration && !hasArrived
    ? `도보 약 ${Math.max(1, Math.ceil(remainingDuration / 60))}분`
    : "";

  const hasValidToiletCoordinates = useCallback((toilet: Toilet) => {
    return (
      typeof toilet.lat === "number" &&
      typeof toilet.lng === "number" &&
      Number.isFinite(toilet.lat) &&
      Number.isFinite(toilet.lng) &&
      toilet.lat >= -90 &&
      toilet.lat <= 90 &&
      toilet.lng >= -180 &&
      toilet.lng <= 180
    );
  }, []);

  const clearToiletMarkers = useCallback(() => {
    markerClustererRef.current?.clear();
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  }, []);

  const clearRouteOverlay = useCallback(() => {
    routeBasePolylineRef.current?.setMap(null);
    routeBasePolylineRef.current = null;
    routePolylineRef.current?.setMap(null);
    routePolylineRef.current = null;
    routeStartOverlayRef.current?.setMap(null);
    routeStartOverlayRef.current = null;
    routeEndOverlayRef.current?.setMap(null);
    routeEndOverlayRef.current = null;
  }, []);

  const clearCurrentLocationMarker = useCallback(() => {
    currentLocationMarkerRef.current?.setMap(null);
    currentLocationMarkerRef.current = null;
  }, []);

  const renderCurrentLocationMarker = useCallback(
    (location: RoutePoint) => {
      if (!isMapReady || !mapInstanceRef.current || !window.kakao?.maps) return;

      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setPosition(new window.kakao.maps.LatLng(location.lat, location.lng));
        return;
      }
      currentLocationMarkerRef.current = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(location.lat, location.lng),
        content:
          '<div style="width:16px;height:16px;border-radius:9999px;background:#dc2626;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);pointer-events:none;"></div>',
        yAnchor: 0.5,
        xAnchor: 0.5,
        zIndex: 30,
        map: mapInstanceRef.current,
      });
    },
    [clearCurrentLocationMarker, isMapReady]
  );

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      setMapLoadFailed(false);
      window.kakao.maps.load(() => {
        const container = mapRef.current;
        if (!container) return;

        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 5,
          draggable: true,
        };

        mapInstanceRef.current = new window.kakao.maps.Map(container, options);
        window.setTimeout(() => {
          mapInstanceRef.current?.relayout();
        }, 0);
        setIsMapReady(true);
        markerClustererRef.current = new window.kakao.maps.MarkerClusterer({
          map: mapInstanceRef.current,
          averageCenter: true,
          minLevel: 4,
          gridSize: 70,
          disableClickZoom: true,
        });
        const handleClusterClick = (cluster: any) => {
          setFollowingLocation(false);
          const map = mapInstanceRef.current;
          if (!map) return;
          focusMapAt(map, cluster.getCenter(), Math.max(1, map.getLevel() - 1));
        };
        clusterClickHandlerRef.current = handleClusterClick;
        window.kakao.maps.event.addListener(markerClustererRef.current, "clusterclick", handleClusterClick);
      });
    };

    const handleMapLoadError = () => {
      setMapLoadFailed(true);
      onAddressMarkerStatusChange?.("complete");
    };

    if (window.kakao?.maps) {
      initMap();
      return;
    }

    window.addEventListener("kakao-maps-loaded", initMap);
    window.addEventListener("kakao-maps-load-error", handleMapLoadError);

    const kakaoScript = document.querySelector(
      'script[src*="dapi.kakao.com/v2/maps"]'
    ) as HTMLScriptElement | null;

    if (kakaoScript) {
      kakaoScript.addEventListener("load", initMap);
      kakaoScript.addEventListener("error", handleMapLoadError);
      return () => {
        window.removeEventListener("kakao-maps-loaded", initMap);
        window.removeEventListener("kakao-maps-load-error", handleMapLoadError);
        kakaoScript.removeEventListener("load", initMap);
        kakaoScript.removeEventListener("error", handleMapLoadError);
      };
    }

    return () => {
      window.removeEventListener("kakao-maps-loaded", initMap);
      window.removeEventListener("kakao-maps-load-error", handleMapLoadError);
    };
  }, [onAddressMarkerStatusChange, setFollowingLocation]);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    const relayoutMap = () => {
      if (!mapInstanceRef.current) return;
      mapInstanceRef.current.relayout();
    };

    relayoutMap();

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(relayoutMap);
    });

    resizeObserver.observe(container);
    window.addEventListener("resize", relayoutMap);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", relayoutMap);
    };
  }, [isMapReady]);

  useEffect(() => {
    let isCancelled = false;

    if (!mapInstanceRef.current) {
      const retry = window.setInterval(() => {
        if (!mapInstanceRef.current) return;
        window.clearInterval(retry);
        renderMarkers();
      }, 100);

      return () => {
        isCancelled = true;
        window.clearInterval(retry);
      };
    }

    renderMarkers();

    function renderMarkers() {
      if (!mapInstanceRef.current || !window.kakao?.maps) return;

      clearToiletMarkers();
      onAddressMarkerStatusChange?.("complete");

      const markers = toilets
        .filter(hasValidToiletCoordinates)
        .filter((toilet) => toilet.id !== selectedToilet?.id)
        .map((toilet) => {
          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(toilet.lat, toilet.lng),
          });

          window.kakao.maps.event.addListener(marker, "click", () => {
            handleMarkerSelection(toilet);
          });

          return marker;
        });

      if (isCancelled || !mapInstanceRef.current) return;

      markersRef.current = markers;
      if (markerClustererRef.current) {
        markerClustererRef.current.addMarkers(markers);
      } else {
        markers.forEach((marker) => marker.setMap(mapInstanceRef.current));
      }
    }

    return () => {
      isCancelled = true;
      clearToiletMarkers();
    };
  }, [
    toilets,
    selectedToilet?.id,
    handleMarkerSelection,
    hasValidToiletCoordinates,
    clearToiletMarkers,
    onAddressMarkerStatusChange,
  ]);

  // 선택한 화장실은 클러스터에 묶이지 않도록 별도 마커로 표시합니다.
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !selectedToilet || !window.kakao?.maps) return;
    if (!hasValidToiletCoordinates(selectedToilet)) return;

    const marker = new window.kakao.maps.Marker({
      map: mapInstanceRef.current,
      position: new window.kakao.maps.LatLng(selectedToilet.lat, selectedToilet.lng),
      image: new window.kakao.maps.MarkerImage(
        selectedToiletMarkerUrl,
        new window.kakao.maps.Size(40, 48),
        { offset: new window.kakao.maps.Point(20, 46) }
      ),
      title: selectedToilet.name,
      zIndex: 100,
    });
    const handleClick = () => handleMarkerSelection(selectedToilet);
    window.kakao.maps.event.addListener(marker, "click", handleClick);

    return () => {
      window.kakao.maps.event.removeListener(marker, "click", handleClick);
      marker.setMap(null);
    };
  }, [isMapReady, selectedToilet, hasValidToiletCoordinates, handleMarkerSelection]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedToilet || !window.kakao?.maps) return;
    if (!hasValidToiletCoordinates(selectedToilet)) return;

    setFollowingLocation(false);

    const position = new window.kakao.maps.LatLng(
      selectedToilet.lat,
      selectedToilet.lng
    );
    focusMapAt(mapInstanceRef.current, position, 3);
  }, [isMapReady, selectedToilet?.id, selectedToilet?.lat, selectedToilet?.lng, hasValidToiletCoordinates, setFollowingLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current || !focusLocation || !window.kakao?.maps) return;

    setFollowingLocation(false);

    const position = new window.kakao.maps.LatLng(
      focusLocation.lat,
      focusLocation.lng
    );

    focusMapAt(mapInstanceRef.current, position, 4);
  }, [isMapReady, focusLocation, setFollowingLocation]);

  useEffect(() => {
    if (!visibleCurrentLocation) {
      clearCurrentLocationMarker();
      return;
    }

    renderCurrentLocationMarker(visibleCurrentLocation);
  }, [
    clearCurrentLocationMarker,
    renderCurrentLocationMarker,
    visibleCurrentLocation,
  ]);

  useEffect(() => {
    routeProgressRef.current = 0;
    previousRouteLocationRef.current = null;
    setRouteProgress(0);
    if (!activeRoute) {
      clearRouteOverlay();
      return;
    }

    if (!isMapReady || !mapInstanceRef.current || !window.kakao?.maps) return;

    setFollowingLocation(true);

    clearRouteOverlay();

    const path = activeRoute.path.map(
      (point) => new window.kakao.maps.LatLng(point.lat, point.lng)
    );

    // 전체 경로를 회색으로 유지하고, 남은 구간을 파란색으로 덮어 표시합니다.
    routeBasePolylineRef.current = new window.kakao.maps.Polyline({
      path,
      strokeWeight: 6,
      strokeColor: "#9ca3af",
      strokeOpacity: 0.9,
      strokeStyle: "solid",
      zIndex: 1,
      map: mapInstanceRef.current,
    });

    routePolylineRef.current = new window.kakao.maps.Polyline({
      path,
      strokeWeight: 6,
      strokeColor: "#2563eb",
      strokeOpacity: 0.9,
      strokeStyle: "solid",
      zIndex: 2,
    });
    routePolylineRef.current.setMap(mapInstanceRef.current);

    routeStartOverlayRef.current = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(activeRoute.start.lat, activeRoute.start.lng),
      content:
        '<div style="padding:5px 9px;border-radius:9999px;background:#16a34a;color:white;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.25);">출발</div>',
      yAnchor: 0.5,
      xAnchor: 0.5,
      map: mapInstanceRef.current,
    });

    if (
      typeof activeRoute.destination.lat === "number" &&
      typeof activeRoute.destination.lng === "number"
    ) {
      routeEndOverlayRef.current = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(
          activeRoute.destination.lat,
          activeRoute.destination.lng
        ),
        content:
          '<div style="padding:5px 9px;border-radius:9999px;background:#dc2626;color:white;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.25);">도착</div>',
        yAnchor: 0.5,
        xAnchor: 0.5,
        map: mapInstanceRef.current,
      });
    }

    const bounds = new window.kakao.maps.LatLngBounds();
    path.forEach((point) => bounds.extend(point));
    mapInstanceRef.current.setBounds(bounds);
    mapInstanceRef.current.setLevel(3);

    return clearRouteOverlay;
  }, [activeRoute, clearRouteOverlay, isMapReady, setFollowingLocation]);

  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !window.kakao?.maps) return;
    const map = mapInstanceRef.current;
    const stopFollowing = () => setFollowingLocation(false);
    window.kakao.maps.event.addListener(map, "dragstart", stopFollowing);
    const container = mapRef.current;
    // 지도 초기화 시 입력 모드를 기억해 F12에서 모바일 모드로 전환해도 터치 보완 처리가 유지되도록 합니다.
    const needsDesktopTouchFallback = !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    let desktopTouch: { x: number; y: number; identifier: number } | null = null;
    const beginDesktopTouch = (event: TouchEvent) => {
      desktopTouch = null;
      if (!needsDesktopTouchFallback || event.touches.length !== 1) return;
      const touch = event.touches[0];
      desktopTouch = { x: touch.clientX, y: touch.clientY, identifier: touch.identifier };
    };
    const moveDesktopTouch = (event: TouchEvent) => {
      if (!desktopTouch || !container) return;
      if (event.touches.length !== 1 || event.touches[0].identifier !== desktopTouch.identifier) {
        desktopTouch = null;
        return;
      }
      const touch = event.touches[0];
      const dx = touch.clientX - desktopTouch.x;
      const dy = touch.clientY - desktopTouch.y;
      if (dx || dy) {
        const point = new window.kakao.maps.Point(container.clientWidth / 2 - dx, container.clientHeight / 2 - dy);
        map.setCenter(map.getProjection().coordsFromContainerPoint(point));
        desktopTouch = { x: touch.clientX, y: touch.clientY, identifier: touch.identifier };
        if (event.cancelable) event.preventDefault();
      }
    };
    const endDesktopTouch = () => { desktopTouch = null; };
    container?.addEventListener("wheel", stopFollowing, { capture: true, passive: true });
    container?.addEventListener("pointerdown", stopFollowing, { capture: true, passive: true });
    container?.addEventListener("touchstart", stopFollowing, { capture: true, passive: true });
    container?.addEventListener("touchstart", beginDesktopTouch, { passive: true });
    container?.addEventListener("touchmove", moveDesktopTouch, { passive: false });
    container?.addEventListener("touchend", endDesktopTouch, { passive: true });
    container?.addEventListener("touchcancel", endDesktopTouch, { passive: true });
    return () => {
      window.kakao.maps.event.removeListener(map, "dragstart", stopFollowing);
      container?.removeEventListener("wheel", stopFollowing, true);
      container?.removeEventListener("pointerdown", stopFollowing, true);
      container?.removeEventListener("touchstart", stopFollowing, true);
      container?.removeEventListener("touchstart", beginDesktopTouch);
      container?.removeEventListener("touchmove", moveDesktopTouch);
      container?.removeEventListener("touchend", endDesktopTouch);
      container?.removeEventListener("touchcancel", endDesktopTouch);
    };
  }, [isMapReady, setFollowingLocation]);

  useEffect(() => {
    if (!isMapReady || !visibleCurrentLocation || !followingLocationRef.current || !window.kakao?.maps) return;
    mapInstanceRef.current?.panTo(new window.kakao.maps.LatLng(visibleCurrentLocation.lat, visibleCurrentLocation.lng));
  }, [isMapReady, visibleCurrentLocation, isFollowingLocation, activeRoute]);

  useEffect(() => {
    if (!activeRoute || !liveLocation || !routePolylineRef.current || !window.kakao?.maps) return;
    // 위치 정확도가 낮아도 현재 위치 마커는 갱신하되, 경로의 이동 완료 처리는 보류합니다.
    if (locationError || !Number.isFinite(liveLocation.accuracy) || liveLocation.accuracy > 50) return;
    const previousLocation = previousRouteLocationRef.current;
    if (previousLocation && liveLocation.timestamp <= previousLocation.timestamp) return;
    const movement = previousLocation ? distanceBetween(previousLocation, liveLocation) : 0;
    const elapsed = previousLocation ? Math.max(0, (liveLocation.timestamp - previousLocation.timestamp) / 1000) : 0;
    const maxAdvance = previousLocation ? Math.min(Math.max(60, movement * 1.5 + 20), Math.max(60, elapsed * 3 + 30)) : 80;
    let progress = advanceRouteProgress(routeGeometry, liveLocation, routeProgressRef.current, maxAdvance, 25);
    const end = routeGeometry.path[routeGeometry.path.length - 1];
    if (end && routeGeometry.length - progress <= 15 && distanceBetween(liveLocation, end) <= 10) {
      progress = routeGeometry.length;
    }
    previousRouteLocationRef.current = liveLocation;
    routeProgressRef.current = progress;
    setRouteProgress(progress);
    const remainingPath = getRemainingPath(routeGeometry, progress);
    routePolylineRef.current.setPath(remainingPath.map((point) => new window.kakao.maps.LatLng(point.lat, point.lng)));
    if (progress > 5) routeStartOverlayRef.current?.setMap(null);
  }, [activeRoute, isMapReady, liveLocation, locationError, routeGeometry]);

  useEffect(() => () => {
    if (markerClustererRef.current && clusterClickHandlerRef.current && window.kakao?.maps) {
      window.kakao.maps.event.removeListener(markerClustererRef.current, "clusterclick", clusterClickHandlerRef.current);
    }
    clearRouteOverlay();
    clearCurrentLocationMarker();
  }, [clearRouteOverlay, clearCurrentLocationMarker]);

  const moveToCurrentLocation = () => {
    if (!mapInstanceRef.current || !window.kakao?.maps || isLocating) return;

    setFollowingLocation(true);
    if (locationError || !visibleCurrentLocation) retryLocation();
    if (visibleCurrentLocation) {
      mapInstanceRef.current.panTo(new window.kakao.maps.LatLng(visibleCurrentLocation.lat, visibleCurrentLocation.lng));
    }
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden" style={{ minHeight: "400px" }}>
      <div ref={mapRef} className="w-full h-full touch-none select-none" style={{ touchAction: "none" }} />

      {mapLoadFailed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white text-center text-red-600">
          <div>
            <h3 className="font-semibold">지도를 불러올 수 없습니다</h3>
            <p className="mt-2 text-sm">카카오맵 설정 또는 네트워크 상태를 확인해주세요.</p>
          </div>
        </div>
      )}

      {activeRoute && (
        <div className="absolute left-4 right-4 top-[3.75rem] z-10 rounded-lg border bg-white p-4 shadow-lg sm:left-6 sm:right-auto sm:w-[320px] lg:top-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-blue-600">{hasArrived ? "목적지에 도착했습니다" : "길 안내 중"}</p>
              <h3 className="mt-1 truncate font-semibold">{activeRoute.destination.name}</h3>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {activeRoute.destination.roadAddress}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearRoute}
              className="h-8 shrink-0 gap-1 px-2"
            >
              <X size={16} />
              취소
            </Button>
          </div>
          {(routeDistanceText || routeTimeText) && (
            <div className="mt-3 flex gap-2 text-sm">
              {routeTimeText && (
                <span className="rounded-md bg-blue-50 px-2 py-1 font-medium text-blue-700">
                  {routeTimeText}
                </span>
              )}
              {routeDistanceText && (
                <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-700">
                  {routeDistanceText}
                </span>
              )}
            </div>
          )}
          {liveLocation && liveLocation.accuracy > 50 && !hasArrived && !locationError && (
            <p role="status" className="mt-2 text-xs text-amber-700">
              위치 정확도가 낮습니다. 신호가 좋아지면 지나간 경로를 반영합니다.
            </p>
          )}
        </div>
      )}

      <button
        onClick={moveToCurrentLocation}
        disabled={isLocating || mapLoadFailed}
        className={`absolute bottom-16 right-3 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 shadow-lg transition-colors lg:bottom-20 lg:right-6 ${
          isLocating || mapLoadFailed ? "bg-gray-100 cursor-not-allowed" : "bg-white hover:bg-gray-50"
        }`}
        aria-label={isFollowingLocation ? "현재 위치 따라가는 중" : "현재 위치 따라가기"}
        aria-pressed={isFollowingLocation}
        title={isFollowingLocation ? "현재 위치 따라가는 중" : "현재 위치 따라가기"}
      >
        {isLocating ? (
          <Loader2 size={24} className="animate-spin text-blue-600" />
        ) : (
          <Navigation size={24} className={`text-blue-600 ${isFollowingLocation ? "fill-blue-100" : ""}`} />
        )}
      </button>
      {locationError && (
        <div role="status" className="absolute bottom-3 left-3 right-3 z-20 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 lg:right-24">
          {locationError}
        </div>
      )}
    </div>
  );
}
