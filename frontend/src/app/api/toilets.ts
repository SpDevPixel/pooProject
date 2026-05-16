/*
 * 파일 위치: src/app/api/toilets.ts
 * 상위 폴더: src/app/api (백엔드 API 통신 함수)
 * 역할: 백엔드 화장실 API를 호출하고 응답 데이터를 프론트 타입으로 변환합니다.
 */
import type { Toilet } from "../types/toilet";

type BackendToilet = {
  managementNo?: string | number | null;
  name?: string | null;
  roadAddress?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  openTime?: string | null;
  openTimeDetail?: string | null;
  managingOrg?: string | null;
  phoneNumber?: string | null;
  wasteDisposal?: string | null;
  hasDisabledFacility?: boolean | null;
  hasDiaperTable?: boolean | null;
  hasEmergencyBell?: boolean | null;
  hasEntranceCctv?: boolean | null;
  isUserSubmitted?: boolean | null;
  rating?: number | null;
  reviewCount?: number | null;
};

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "/api";

const toNumber = (value: BackendToilet["lat"]) => {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const normalizeToilet = (toilet: BackendToilet): Toilet | null => {
  const lat = toNumber(toilet.lat);
  const lng = toNumber(toilet.lng);
  const managementNo = toilet.managementNo?.toString();

  if (!managementNo || !toilet.name || !toilet.roadAddress) {
    return null;
  }

  return {
    id: managementNo,
    managementNo,
    name: toilet.name,
    roadAddress: toilet.roadAddress ?? "",
    lat,
    lng,
    openTime: toilet.openTime ?? undefined,
    openTimeDetail: toilet.openTimeDetail ?? undefined,
    managingOrg: toilet.managingOrg ?? undefined,
    phoneNumber: toilet.phoneNumber ?? undefined,
    wasteDisposal: toilet.wasteDisposal ?? undefined,
    hasDisabledFacility: Boolean(toilet.hasDisabledFacility),
    hasDiaperTable: Boolean(toilet.hasDiaperTable),
    hasEmergencyBell: Boolean(toilet.hasEmergencyBell),
    hasEntranceCctv: Boolean(toilet.hasEntranceCctv),
    isUserSubmitted: Boolean(toilet.isUserSubmitted),
    rating: toilet.rating ?? undefined,
    reviewCount: toilet.reviewCount ?? undefined,
  };
};

export const fetchToilets = async (): Promise<Toilet[]> => {
  const response = await fetch(`${API_BASE_URL}/toilets/all`);

  if (!response.ok) {
    throw new Error("화장실 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
  }

  const data = (await response.json()) as BackendToilet[];

  return data.map(normalizeToilet).filter((toilet): toilet is Toilet => toilet !== null);
};
