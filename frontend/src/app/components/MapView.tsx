/*
 * 파일 위치: src/app/components/MapView.tsx
 * 상위 폴더: src/app/components (화면에서 재사용하는 컴포넌트)
 * 역할: 카카오맵을 렌더링하고 화장실 마커와 현재 위치 표시를 관리합니다.
 */
import { useEffect, useRef, useState } from "react";
// 🚨 새로 추가된 부분: 로딩 효과를 주기 위해 Loader2 아이콘을 가져옵니다. (대문자 L 주의)
import { Navigation, Loader2 } from "lucide-react"; 
import type { Toilet } from "../types/toilet";

declare global {
  interface Window {
    kakao: any;
  }
}

interface MapViewProps {
  toilets: Toilet[];
  selectedToilet: Toilet | null;
  onMarkerClick: (toilet: Toilet) => void;
}

export function MapView({ toilets, selectedToilet, onMarkerClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const currentLocationMarkerRef = useRef<any>(null);

  // 🚨 모바일 최적화 1: 위치를 찾는 중인지 확인하는 상태값 (단수형 isLocating)
  const [isLocating, setIsLocating] = useState(false);

  // 1. 지도 초기화
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      if (!mapRef.current) return;
      window.kakao.maps.load(() => {
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 5,
        };
        mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, options);
      });
    };

    if (window.kakao?.maps) {
      initMap();
      return;
    }

    const kakaoScript = document.querySelector('script[src*="dapi.kakao.com/v2/maps"]') as HTMLScriptElement | null;
    if (kakaoScript) {
      kakaoScript.addEventListener("load", initMap);
      return () => kakaoScript.removeEventListener("load", initMap);
    }
  }, []);

  // 2. 마커 렌더링
  useEffect(() => {
    if (!mapInstanceRef.current) {
      const retry = setInterval(() => {
        if (!mapInstanceRef.current) return;
        clearInterval(retry);
        renderMarkers();
      }, 100);
      return () => clearInterval(retry);
    }

    renderMarkers();

    function renderMarkers() {
      if (!mapInstanceRef.current || !window.kakao?.maps) return;

      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      toilets.forEach((toilet) => {
        const position = new window.kakao.maps.LatLng(toilet.lat, toilet.lng);
        const marker = new window.kakao.maps.Marker({ position });
        marker.setMap(mapInstanceRef.current);

        window.kakao.maps.event.addListener(marker, "click", () => {
          onMarkerClick(toilet);
        });

        markersRef.current.push(marker);
      });
    }
  }, [toilets, onMarkerClick]);

  // 3. 선택된 화장실로 지도 이동
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedToilet || !window.kakao?.maps) return;
    const position = new window.kakao.maps.LatLng(selectedToilet.lat, selectedToilet.lng);
    mapInstanceRef.current.panTo(position);
  }, [selectedToilet]);

  // 4. 모바일 최적화: 현재 위치로 이동
  const moveToCurrentLocation = () => {
    if (!mapInstanceRef.current || !window.kakao?.maps) return;

    // 이미 위치를 찾는 중이면 버튼을 여러 번 눌러도 무시합니다.
    if (isLocating) return;

    if (navigator.geolocation) {
      setIsLocating(true); // 버튼 모양을 로딩 아이콘으로 바꿉니다.

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 복수형 coords 주의!
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const locPosition = new window.kakao.maps.LatLng(lat, lng);

          if (currentLocationMarkerRef.current) {
            currentLocationMarkerRef.current.setMap(null);
          }

          const newMarker = new window.kakao.maps.Marker({
            position: locPosition,
            map: mapInstanceRef.current,
          });

          currentLocationMarkerRef.current = newMarker;
          mapInstanceRef.current.panTo(locPosition);
          setIsLocating(false); // 위치 찾기 완료! 로딩 아이콘을 끕니다.
        },
        (error) => {
          setIsLocating(false); // 에러가 나도 로딩 아이콘은 꺼줘야 합니다.
          console.error("위치 정보 에러:", error);
          if (error.code === 1) {
            alert("스마트폰 설정에서 브라우저의 위치 권한을 '허용'으로 변경해 주세요.");
          } else if (error.code === 2) {
            alert("GPS 신호를 잡을 수 없습니다. 실외로 이동하거나 잠시 후 다시 시도해 주세요.");
          } else if (error.code === 3) {
            alert("위치 정보를 가져오는 데 시간이 너무 오래 걸립니다. 네트워크를 확인해 주세요.");
          }
        },
        // 🚨 모바일 최적화 2: 정확도 높임, 시간 10초 대기, 캐시 안 씀
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
    }
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden" style={{ minHeight: "400px" }}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* 🚨 모바일 최적화 3: 로딩 상태에 따라 버튼 디자인과 아이콘이 바뀝니다 */}
      <button
        onClick={moveToCurrentLocation}
        disabled={isLocating}
        className={`absolute bottom-6 right-6 z-10 p-3 rounded-full shadow-lg transition-colors border border-gray-200 flex items-center justify-center
          ${isLocating ? "bg-gray-100 cursor-not-allowed" : "bg-white hover:bg-gray-50"}`}
        aria-label="현재 위치로 이동"
      >
        {isLocating ? (
          // 로딩 중일 때는 빙글빙글 도는(animate-spin) Loader2 아이콘 표시
          <Loader2 size={24} className="text-blue-600 animate-spin" />
        ) : (
          <Navigation size={24} className="text-blue-600" />
        )}
      </button>
    </div>
  );
}
