import type { RoutePoint } from "../api/tmapRoutes";

export type LiveLocation = RoutePoint & { accuracy: number; timestamp: number };

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
