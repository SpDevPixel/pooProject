/*
 * 파일 위치: src/app/components/MapView.tsx
 * 상위 폴더: src/app/components (화면에서 재사용하는 컴포넌트)
 * 역할: 카카오맵을 렌더링, 좌표가 있는 화장실 마커와 현재 위치 표시를 관리
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Navigation, X } from "lucide-react";
import type { Toilet } from "../types/toilet";
import type { RoutePoint, TmapRouteResult } from "../api/tmapRoutes";
import { Button } from "./ui/button";

interface MapViewProps {
  toilets: Toilet[];
  selectedToilet: Toilet | null;
  focusLocation?: (RoutePoint & { key?: number }) | null;
  activeRoute?: TmapRouteResult | null;
  currentLocation?: RoutePoint | null;
  onClearRoute?: () => void;
  onCurrentLocationChange?: (location: RoutePoint) => void;
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
  const currentLocationMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const routeStartOverlayRef = useRef<any>(null);
  const routeEndOverlayRef = useRef<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [internalCurrentLocation, setInternalCurrentLocation] = useState<RoutePoint | null>(null);
  const visibleCurrentLocation = currentLocation ?? internalCurrentLocation;

  const routeDistanceText = activeRoute?.distance
    ? `${activeRoute.distance >= 1000 ? `${(activeRoute.distance / 1000).toFixed(1)}km` : `${Math.round(activeRoute.distance)}m`}`
    : "";
  const routeTimeText = activeRoute?.duration
    ? `도보 약 ${Math.max(1, Math.ceil(activeRoute.duration / 60))}분`
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

      clearCurrentLocationMarker();
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
          disableClickZoom: false,
        });
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
  }, [onAddressMarkerStatusChange]);

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
        .map((toilet) => {
          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(toilet.lat, toilet.lng),
          });

          window.kakao.maps.event.addListener(marker, "click", () => {
            onMarkerClick(toilet);
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
    onMarkerClick,
    hasValidToiletCoordinates,
    clearToiletMarkers,
    onAddressMarkerStatusChange,
  ]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedToilet || !window.kakao?.maps) return;
    if (!hasValidToiletCoordinates(selectedToilet)) return;

    const position = new window.kakao.maps.LatLng(
      selectedToilet.lat,
      selectedToilet.lng
    );
    mapInstanceRef.current.panTo(position);
    if (typeof mapInstanceRef.current.setLevel === "function") {
      mapInstanceRef.current.setLevel(3);
    }
  }, [selectedToilet, hasValidToiletCoordinates]);

  useEffect(() => {
    if (!mapInstanceRef.current || !focusLocation || !window.kakao?.maps) return;

    const position = new window.kakao.maps.LatLng(
      focusLocation.lat,
      focusLocation.lng
    );

    mapInstanceRef.current.panTo(position);
    if (typeof mapInstanceRef.current.setLevel === "function") {
      mapInstanceRef.current.setLevel(4);
    }
  }, [focusLocation]);

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
    if (!activeRoute) {
      clearRouteOverlay();
      return;
    }

    if (!isMapReady || !mapInstanceRef.current || !window.kakao?.maps) return;

    clearRouteOverlay();

    const path = activeRoute.path.map(
      (point) => new window.kakao.maps.LatLng(point.lat, point.lng)
    );

    routePolylineRef.current = new window.kakao.maps.Polyline({
      path,
      strokeWeight: 6,
      strokeColor: "#2563eb",
      strokeOpacity: 0.9,
      strokeStyle: "solid",
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

    return clearRouteOverlay;
  }, [activeRoute, clearRouteOverlay, isMapReady]);

  const moveToCurrentLocation = () => {
    if (!mapInstanceRef.current || !window.kakao?.maps || isLocating) return;

    if (!navigator.geolocation) {
      alert("현재 브라우저에서는 위치 정보를 사용할 수 없습니다.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const location = { lat, lng };
        const locPosition = new window.kakao.maps.LatLng(lat, lng);

        setInternalCurrentLocation(location);
        onCurrentLocationChange?.(location);
        renderCurrentLocationMarker(location);

        mapInstanceRef.current.panTo(locPosition);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        console.error("위치 정보 오류:", error);

        if (error.code === 1) {
          alert("위치 권한이 꺼져 있습니다. 브라우저 위치 권한을 허용해주세요.");
        } else if (error.code === 2) {
          alert("현재 위치를 찾지 못했습니다. 잠시 후 다시 시도해주세요.");
        } else if (error.code === 3) {
          alert("위치 확인 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.");
        } else {
          alert("현재 위치를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden" style={{ minHeight: "400px" }}>
      <div ref={mapRef} className="w-full h-full" />

      {mapLoadFailed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white text-center text-red-600">
          <div>
            <h3 className="font-semibold">지도를 불러올 수 없습니다</h3>
            <p className="mt-2 text-sm">카카오맵 설정 또는 네트워크 상태를 확인해주세요.</p>
          </div>
        </div>
      )}

      {activeRoute && (
        <div className="absolute left-4 right-4 top-4 z-10 rounded-lg border bg-white p-4 shadow-lg sm:left-6 sm:right-auto sm:w-[320px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-blue-600">길 안내 중</p>
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
        </div>
      )}

      <button
        onClick={moveToCurrentLocation}
        disabled={isLocating || mapLoadFailed}
        className={`absolute bottom-16 right-3 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 shadow-lg transition-colors lg:bottom-20 lg:right-6 ${
          isLocating || mapLoadFailed ? "bg-gray-100 cursor-not-allowed" : "bg-white hover:bg-gray-50"
        }`}
        aria-label="현재 위치로 이동"
      >
        {isLocating ? (
          <Loader2 size={24} className="animate-spin text-blue-600" />
        ) : (
          <Navigation size={24} className="text-blue-600" />
        )}
      </button>
    </div>
  );
}
