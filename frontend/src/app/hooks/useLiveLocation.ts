import { useCallback, useEffect, useRef, useState } from "react";
import { getLocationErrorMessage, watchLiveLocation, type LiveLocation } from "../utils/locationTracking";

export function useLiveLocation(onLocationChange?: (location: LiveLocation) => void) {
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
        callbackRef.current?.(next);
      },
      (positionError) => {
        setIsLocating(false);
        setError(getLocationErrorMessage(positionError));
      }
    );
  }, [attempt]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);
  return { location, error, isLocating, retry };
}
