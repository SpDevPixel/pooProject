import type { BackendUser } from "./users";
import type { Toilet } from "../types/toilet";
import { normalizeToilet, type BackendToilet } from "./toilets";

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "/api";

export type AdminUser = {
  id: string;
  userId: string;
  email: string;
  name: string;
  nickname?: string;
  address?: string;
  role: string;
};

export type UpdateAdminToiletRequest = {
  name: string;
  roadAddress: string;
  openTime: string;
  managingOrg: string;
  phoneNumber: string;
  disabledFacility: boolean;
  emergencyBell: boolean;
  diaperTable: boolean;
  entranceCctv: boolean;
  status: string;
};

const toNumber = (value: BackendToilet["lat"]) => {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const normalizeStatus = (status?: string | null) => status?.trim().toUpperCase();

const normalizeBoolean = (value?: boolean | string | null) => {
  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true";
  }

  return Boolean(value);
};

const normalizeAdminUser = (user: BackendUser): AdminUser => ({
  id: String(user.id ?? ""),
  userId: user.userId ?? "",
  email: user.email ?? "",
  name: user.name ?? "",
  nickname: user.nickname ?? undefined,
  address: user.address ?? undefined,
  role: user.role ?? "USER",
});

const normalizeAdminToilet = (toilet: BackendToilet): Toilet | null => {
  const backendId = toNumber(toilet.id);

  if (!backendId) {
    return null;
  }

  const managementNo = toilet.managementNo?.toString() || String(backendId);

  return {
    id: managementNo,
    backendId,
    managementNo,
    name: toilet.name ?? "이름 없음",
    roadAddress: toilet.roadAddress ?? "",
    lat: toNumber(toilet.lat),
    lng: toNumber(toilet.lng),
    openTime: toilet.openTime ?? undefined,
    openTimeDetail: toilet.openTimeDetail ?? undefined,
    managingOrg: toilet.managingOrg ?? undefined,
    phoneNumber: toilet.phoneNumber ?? undefined,
    wasteDisposal: toilet.wasteDisposal ?? undefined,
    hasDisabledFacility: Boolean(toilet.hasDisabledFacility),
    hasDiaperTable: Boolean(toilet.hasDiaperTable),
    hasEmergencyBell: Boolean(toilet.hasEmergencyBell),
    hasEntranceCctv: Boolean(toilet.hasEntranceCctv),
    isUserSubmitted: normalizeBoolean(toilet.isUserSubmitted),
    status: normalizeStatus(toilet.status),
    rating: toilet.rating ?? undefined,
    reviewCount: toilet.reviewCount ?? undefined,
  };
};

const getAdminApiErrorMessage = (response: Response, fallback: string) => {
  if (response.status === 401 || response.status === 403) {
    return "관리자 권한이 없거나 로그인이 만료되었습니다.";
  }

  if (response.status >= 500) {
    return "서버에서 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  return fallback;
};

export const fetchAdminToilets = async (token: string): Promise<Toilet[]> => {
  const response = await fetch(`${API_BASE_URL}/admin`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(getAdminApiErrorMessage(response, "전체 화장실 목록을 불러오지 못했습니다."));
  }

  const data = (await response.json()) as BackendToilet[];
  return data.map(normalizeAdminToilet).filter((toilet): toilet is Toilet => toilet !== null);
};

export const updateAdminToilet = async (
  toiletId: string | number,
  payload: UpdateAdminToiletRequest,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/${encodeURIComponent(String(toiletId))}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(getAdminApiErrorMessage(response, "화장실 정보 수정에 실패했습니다."));
  }
};

export const deleteAdminToilet = async (
  toiletId: string | number,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/${encodeURIComponent(String(toiletId))}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(getAdminApiErrorMessage(response, "화장실 삭제에 실패했습니다."));
  }
};

export const fetchAdminUsers = async (token: string): Promise<AdminUser[]> => {
  const response = await fetch(`${API_BASE_URL}/admin/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(getAdminApiErrorMessage(response, "회원 목록을 불러오지 못했습니다."));
  }

  const data = (await response.json()) as BackendUser[];
  return data.map(normalizeAdminUser);
};

export const forceWithdrawUser = async (targetUserId: string, token: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/admin/admin/user/${encodeURIComponent(targetUserId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(getAdminApiErrorMessage(response, "회원 강제탈퇴에 실패했습니다."));
  }
};

export const fetchPendingToilets = async (token: string): Promise<Toilet[]> => {
  const response = await fetch(`${API_BASE_URL}/admin/pending`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status !== 404) {
      throw new Error(getAdminApiErrorMessage(response, "승인 대기 화장실을 불러오지 못했습니다."));
    }

    const fallbackResponse = await fetch(`${API_BASE_URL}/toilets/all`);

    if (!fallbackResponse.ok) {
      throw new Error(getAdminApiErrorMessage(fallbackResponse, "승인 대기 화장실을 불러오지 못했습니다."));
    }

    const fallbackData = (await fallbackResponse.json()) as BackendToilet[];
    return fallbackData
      .map(normalizeToilet)
      .filter((toilet): toilet is Toilet => toilet !== null)
      .filter((toilet) => toilet.isUserSubmitted && toilet.status !== "APPROVED" && toilet.status !== "REJECTED");
  }

  const data = (await response.json()) as BackendToilet[];
  return data
    .map(normalizeToilet)
    .filter((toilet): toilet is Toilet => toilet !== null)
    .filter((toilet) => toilet.status === undefined || toilet.status === "PENDING");
};

export const approvePendingToilet = async (
  toiletId: string | number,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/${encodeURIComponent(String(toiletId))}/approve`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(getAdminApiErrorMessage(response, "화장실 승인에 실패했습니다."));
  }
};

export const rejectPendingToilet = async (
  toiletId: string | number,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/${encodeURIComponent(String(toiletId))}/reject`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(getAdminApiErrorMessage(response, "화장실 반려에 실패했습니다."));
  }
};
