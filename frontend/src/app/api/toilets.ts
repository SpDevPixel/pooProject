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

export type CreateUserToiletRequest = {
  managementNo: string;
  name: string;
  roadAddress: string;
  lat: number;
  lng: number;
  openTime: string | null;
  openTimeDetail: string | null;
  managingOrg: string | null;
  phoneNumber: string | null;
  wasteDisposal: string | null;
  hasDisabledFacility: boolean;
  hasEmergencyBell: boolean;
  hasDiaperTable: boolean;
  hasEntranceCctv: boolean;
  isUserSubmitted: boolean;
};

export type UpdateUserToiletRequest = {
  openTime: string;
  openTimeDetail: string;
  managingOrg: string;
  phoneNumber: string;
  wasteDisposal: string;
  emergencyBell: boolean;
  diaperTable: boolean;
  entranceCctv: boolean;
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

  // 좌표로만 찍기
  // if (!managementNo || !toilet.name || !toilet.roadAddress) {
  if (!managementNo || !toilet.name || lat === null || lng === null) {
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

export const createUserToilet = async (
  payload: CreateUserToiletRequest,
  token: string
): Promise<Toilet> => {
  const response = await fetch(`${API_BASE_URL}/toilets/user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("로그인이 만료되었습니다. 다시 로그인한 뒤 등록해주세요.");
    }

    throw new Error("화장실 등록에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }

  const data = (await response.json()) as BackendToilet;
  const toilet = normalizeToilet(data);

  if (!toilet) {
    throw new Error("등록된 화장실 정보를 확인하지 못했습니다.");
  }

  return toilet;
};

export const fetchUserToilets = async (token: string): Promise<Toilet[]> => {
  const response = await fetch(`${API_BASE_URL}/toilets/userToilets`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
    }

    throw new Error("등록한 화장실을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
  }

  const data = (await response.json()) as BackendToilet[];

  return data.map(normalizeToilet).filter((toilet): toilet is Toilet => toilet !== null);
};

export const deleteUserToilet = async (
  managementNo: string,
  token: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/toilets/toilet/${encodeURIComponent(managementNo)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("삭제 권한이 없거나 로그인이 만료되었습니다.");
    }

    throw new Error("화장실 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }
};

export const updateUserToilet = async (
  managementNo: string,
  payload: UpdateUserToiletRequest,
  token: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/toilets/${encodeURIComponent(managementNo)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("수정 권한이 없거나 로그인이 만료되었습니다.");
    }

    throw new Error("화장실 정보 수정에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }
};
