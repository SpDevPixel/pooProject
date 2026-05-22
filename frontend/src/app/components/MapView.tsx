/*
 * 파일 위치: src/app/components/MapView.tsx
 * 상위 폴더: src/app/components (화면에서 재사용하는 컴포넌트)
 * 역할: 카카오맵을 렌더링하고 좌표가 있는 화장실 마커와 현재 위치 표시를 관리합니다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Navigation } from "lucide-react";
import type { Toilet } from "../types/toilet";

interface MapViewProps {
  toilets: Toilet[];
  selectedToilet: Toilet | null;
  onMarkerClick: (toilet: Toilet) => void;
  onAddressMarkerStatusChange?: (status: "loading" | "complete") => void;
}

export function MapView({
  toilets,
  selectedToilet,
  onMarkerClick,
  onAddressMarkerStatusChange,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markerClustererRef = useRef<any>(null);
  const currentLocationMarkerRef = useRef<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);

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
  }, [selectedToilet, hasValidToiletCoordinates]);

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
        const locPosition = new window.kakao.maps.LatLng(lat, lng);

        currentLocationMarkerRef.current?.setMap(null);
        currentLocationMarkerRef.current = new window.kakao.maps.CustomOverlay({
          position: locPosition,
          content:
            '<div style="width:16px;height:16px;border-radius:9999px;background:#dc2626;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>',
          yAnchor: 0.5,
          xAnchor: 0.5,
          map: mapInstanceRef.current,
        });

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

      <button
        onClick={moveToCurrentLocation}
        disabled={isLocating || mapLoadFailed}
        className={`absolute bottom-6 right-6 z-10 flex items-center justify-center rounded-full border border-gray-200 p-3 shadow-lg transition-colors ${
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
