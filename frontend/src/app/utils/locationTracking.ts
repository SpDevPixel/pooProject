import type { RoutePoint } from "../api/tmapRoutes";

export type LiveLocation = RoutePoint & { accuracy: number; timestamp: number };

export function getLocationErrorMessage(error: Pick<GeolocationPositionError, "code">) {
  if (error.code === 1) return "위치 권한이 차단되어 있습니다. 브라우저와 기기의 위치 권한을 허용해주세요.";
  if (error.code === 3) return "위치 확인 시간이 초과되었습니다. 기기의 위치 서비스를 켜고 다시 시도해주세요.";
  return "기기에서 위치 정보를 가져오지 못했습니다. 기기의 위치 서비스와 브라우저 위치 권한을 확인해주세요.";
}

export async function getCurrentRoutePoint(recentLocation?: LiveLocation | null): Promise<RoutePoint> {
  if (!window.isSecureContext) throw new Error("현재 접속 주소에서는 위치를 사용할 수 없습니다. HTTPS 주소 또는 localhost로 접속해주세요.");
  if (!navigator.geolocation) throw new Error("현재 브라우저에서 위치 정보를 사용할 수 없습니다.");

  // 위치 권한이 차단되었다면 이전에 얻은 좌표로 길찾기를 시작하지 않습니다.
  let permission: PermissionState | undefined;
  try { permission = (await navigator.permissions?.query({ name: "geolocation" })).state; } catch { /* 일부 브라우저는 위치 권한 조회를 지원하지 않습니다. */ }
  if (permission === "denied") throw new Error(getLocationErrorMessage({ code: 1 }));

  const age = recentLocation ? Date.now() - recentLocation.timestamp : Infinity;
  if (recentLocation && age >= 0 && age <= 30000
    && Number.isFinite(recentLocation.lat) && Math.abs(recentLocation.lat) <= 90
    && Number.isFinite(recentLocation.lng) && Math.abs(recentLocation.lng) <= 180) {
    return { lat: recentLocation.lat, lng: recentLocation.lng };
  }

  const requestPosition = (enableHighAccuracy: boolean) => new Promise<RoutePoint>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      reject,
      { enableHighAccuracy, timeout: enableHighAccuracy ? 15000 : 10000, maximumAge: 30000 }
    );
  });
  try {
    return await requestPosition(true);
  } catch (error) {
    if ((error as GeolocationPositionError).code === 1) throw new Error(getLocationErrorMessage(error as GeolocationPositionError));
    // 정밀한 위치 조회가 실패하면 일반 정확도로 다시 조회해 컴퓨터에서도 위치를 확인합니다.
    try { return await requestPosition(false); }
    catch (fallbackError) { throw new Error(getLocationErrorMessage(fallbackError as GeolocationPositionError)); }
  }
}

export function watchLiveLocation(
  onLocation: (location: LiveLocation) => void,
  onError: (error: GeolocationPositionError) => void
) {
  let disposed = false;
  let latestTimestamp = 0;
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      if (disposed || position.timestamp < latestTimestamp) return;
      latestTimestamp = position.timestamp;
      onLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    },
    (error) => { if (!disposed) onError(error); },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
  return () => {
    disposed = true;
    navigator.geolocation.clearWatch(watchId);
  };
}
