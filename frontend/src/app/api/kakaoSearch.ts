import type { RoutePoint } from "./tmapRoutes";

export type SearchLocation = RoutePoint & {
  label: string;
  address: string;
  category?: string;
  isSubwayStation?: boolean;
};

const toSearchLocation = (document: any, fallbackLabel: string): SearchLocation | null => {
  if (!document?.x || !document?.y) return null;

  return {
    lat: Number(document.y),
    lng: Number(document.x),
    label: document.place_name || document.address_name || fallbackLabel,
    address:
      document.road_address_name ||
      document.road_address?.address_name ||
      document.address_name ||
      "",
    category: document.category_group_name || document.category_name,
    isSubwayStation:
      document.category_group_code === "SW8" ||
      String(document.category_name ?? "").includes("지하철"),
  };
};

const dedupeSearchLocations = (locations: SearchLocation[]) => {
  const seen = new Set<string>();

  return locations.filter((location) => {
    const key = `${location.label}:${location.lat.toFixed(6)}:${location.lng.toFixed(6)}`;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

export const searchKakaoLocations = async (keyword: string): Promise<SearchLocation[]> => {
  const REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY;
  if (!REST_KEY) return [];

  const headers = {
    Authorization: `KakaoAK ${REST_KEY}`,
  };

  const requestKeywordSearch = async (extraParams = "") => {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}&size=5${extraParams}`,
      { headers }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.documents ?? [])
      .map((document: any) => toSearchLocation(document, keyword))
      .filter((location: SearchLocation | null): location is SearchLocation => location !== null);
  };

  const [subwayLocations, keywordLocations] = await Promise.all([
    requestKeywordSearch("&category_group_code=SW8"),
    requestKeywordSearch(),
  ]);

  const addressResponse = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(keyword)}`,
    { headers }
  );

  const addressLocations = addressResponse.ok
    ? ((await addressResponse.json()).documents ?? [])
        .map((document: any) => toSearchLocation(document, keyword))
        .filter((location: SearchLocation | null): location is SearchLocation => location !== null)
    : [];

  return dedupeSearchLocations([
    ...subwayLocations,
    ...keywordLocations,
    ...addressLocations,
  ]).slice(0, 3);
};
