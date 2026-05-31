import type { Toilet } from "../types/toilet";

export type RoutePoint = {
  lat: number;
  lng: number;
};

export type TmapRouteResult = {
  destination: Toilet;
  start: RoutePoint;
  path: RoutePoint[];
  distance: number;
  duration: number;
};

type TmapRouteFeature = {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: number[] | number[][];
  };
  properties?: {
    totalDistance?: number;
    totalTime?: number;
  };
};

type TmapRouteResponse = {
  features?: TmapRouteFeature[];
};

const TMAP_ROUTE_URL =
  "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json";

const getTmapKey = () => (import.meta as any).env.VITE_TMAP_KEY as string | undefined;

const encodeRouteName = (name: string) => {
  try {
    return encodeURIComponent(name);
  } catch {
    return name;
  }
};

export const fetchPedestrianRoute = async ({
  start,
  destination,
}: {
  start: RoutePoint;
  destination: Toilet;
}): Promise<TmapRouteResult> => {
  const appKey = getTmapKey();

  if (!appKey) {
    throw new Error("TMAP API 키가 없습니다. .env의 VITE_TMAP_KEY를 확인해주세요.");
  }

  if (typeof destination.lat !== "number" || typeof destination.lng !== "number") {
    throw new Error("목적지 좌표가 없어 길 안내를 시작할 수 없습니다.");
  }

  const response = await fetch(TMAP_ROUTE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      appKey,
    },
    body: JSON.stringify({
      startX: start.lng,
      startY: start.lat,
      endX: destination.lng,
      endY: destination.lat,
      reqCoordType: "WGS84GEO",
      resCoordType: "WGS84GEO",
      startName: encodeRouteName("현재 위치"),
      endName: encodeRouteName(destination.name),
    }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("TMAP API 키 권한을 확인해주세요.");
    }

    throw new Error("TMAP 경로 안내를 불러오지 못했습니다.");
  }

  const data = (await response.json()) as TmapRouteResponse;
  const features = data.features ?? [];
  const summary = features.find(
    (feature) =>
      typeof feature.properties?.totalDistance === "number" ||
      typeof feature.properties?.totalTime === "number"
  );
  const path = features.flatMap((feature) => {
    if (feature.geometry?.type !== "LineString") return [];
    if (!Array.isArray(feature.geometry.coordinates)) return [];

    return (feature.geometry.coordinates as number[][])
      .map(([lng, lat]) => ({ lat, lng }))
      .filter(
        (point) =>
          Number.isFinite(point.lat) &&
          Number.isFinite(point.lng) &&
          point.lat >= -90 &&
          point.lat <= 90 &&
          point.lng >= -180 &&
          point.lng <= 180
      );
  });

  if (path.length === 0) {
    throw new Error("TMAP 경로 좌표를 확인하지 못했습니다.");
  }

  return {
    destination,
    start,
    path,
    distance: summary?.properties?.totalDistance ?? 0,
    duration: summary?.properties?.totalTime ?? 0,
  };
};
