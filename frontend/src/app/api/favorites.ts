import type { BackendToilet } from "./toilets";
import { normalizeToilet } from "./toilets";
import type { Toilet } from "../types/toilet";

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "/api";

const getFavoriteApiErrorMessage = (response: Response, fallback: string) => {
  if (response.status === 401 || response.status === 403) {
    return "로그인이 만료되었거나 즐겨찾기 권한이 없습니다. 다시 로그인해주세요.";
  }

  if (response.status >= 500) {
    return "서버에서 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  return fallback;
};

export const getBackendToiletId = (toilet: Toilet) => {
  if (typeof toilet.backendId === "number" && Number.isFinite(toilet.backendId)) {
    return toilet.backendId;
  }

  const numericId = Number(toilet.id);
  return Number.isFinite(numericId) ? numericId : null;
};

export const fetchFavoriteToilets = async (token: string): Promise<Toilet[]> => {
  const response = await fetch(`${API_BASE_URL}/favorite/toilets`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(getFavoriteApiErrorMessage(response, "즐겨찾기 목록을 불러오지 못했습니다."));
  }

  const data = (await response.json()) as BackendToilet[];

  return data.map(normalizeToilet).filter((toilet): toilet is Toilet => toilet !== null);
};

export const addFavoriteToilet = async (toiletId: number, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/favorite/favorites/${toiletId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(getFavoriteApiErrorMessage(response, "즐겨찾기 추가에 실패했습니다."));
  }
};

export const deleteFavoriteToilet = async (toiletId: number, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/favorite/favorites/${toiletId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(getFavoriteApiErrorMessage(response, "즐겨찾기 취소에 실패했습니다."));
  }
};
