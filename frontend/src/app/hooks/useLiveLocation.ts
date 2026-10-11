import { useCallback, useEffect, useRef, useState } from "react";
import type { RoutePoint } from "../api/tmapRoutes";
import { watchLiveLocation, type LiveLocation } from "../utils/locationTracking";

export function useLiveLocation(onLocationChange?: (location: RoutePoint) => void) {
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const callbackRef = useRef(onLocationChange);

  useEffect(() => { callbackRef.current = onLocationChange; }, [onLocationChange]);

  useEffect(() => {
    if (!navigator.geolocation || !window.isSecureContext) {
      setError(!window.isSecureContext
        ? "위치 추적을 사용하려면 HTTPS로 접속해주세요."
        : "현재 브라우저에서는 위치 정보를 사용할 수 없습니다.");
      return;
    }

    setIsLocating(true);
    setError(null);
    return watchLiveLocation(
      (next) => {
        setLocation(next);
        setIsLocating(false);
        setError(null);
        callbackRef.current?.({ lat: next.lat, lng: next.lng });
      },
      (positionError) => {
        setIsLocating(false);
        setError(positionError.code === 1
          ? "위치 권한을 허용한 뒤 현재 위치 버튼을 눌러주세요."
          : "현재 위치를 확인하지 못했습니다. 위치 신호가 잡히면 자동으로 다시 반영됩니다.");
      }
    );
  }, [attempt]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);
  return { location, error, isLocating, retry };
}
