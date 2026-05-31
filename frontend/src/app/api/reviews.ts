import type { Review, Toilet } from "../types/toilet";

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "/api";

type BackendReview = {
  id?: number | string | null;
  toiletId?: number | string | null;
  toiletManagementNo?: string | null;
  toiletName?: string | null;
  roadAddress?: string | null;
  userId?: number | string | null;
  userLoginId?: string | null;
  userName?: string | null;
  rating?: number | null;
  cleanliness?: number | null;
  hasTissuePaper?: boolean | null;
  hasDoorLock?: boolean | null;
  comment?: string | null;
  createdAt?: string | null;
};

export type CreateReviewRequest = {
  toiletId: number;
  rating: number;
  cleanliness: number;
  hasTissuePaper: boolean;
  hasDoorLock: boolean;
  comment: string;
};

const getReviewApiErrorMessage = (response: Response, fallback: string) => {
  if (response.status === 401 || response.status === 403) {
    return "로그인이 만료되었거나 리뷰 권한이 없습니다. 다시 로그인해주세요.";
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

const normalizeReview = (review: BackendReview): Review => ({
  id: String(review.id ?? ""),
  toiletId: String(review.toiletManagementNo ?? review.toiletId ?? ""),
  toiletBackendId:
    review.toiletId !== undefined && review.toiletId !== null
      ? Number(review.toiletId)
      : undefined,
  toiletName: review.toiletName ?? "화장실 정보 없음",
  roadAddress: review.roadAddress ?? "",
  userId: String(review.userLoginId ?? review.userId ?? ""),
  userName: review.userName ?? review.userLoginId ?? "사용자",
  rating: review.rating ?? 0,
  cleanliness: review.cleanliness ?? 0,
  hasTissuePaper: Boolean(review.hasTissuePaper),
  hasDoorLock: Boolean(review.hasDoorLock),
  comment: review.comment ?? "",
  createdAt: review.createdAt ? new Date(review.createdAt) : new Date(),
});

export const fetchToiletReviews = async (managementNo: string): Promise<Review[]> => {
  const response = await fetch(`${API_BASE_URL}/review/${encodeURIComponent(managementNo)}`);

  if (!response.ok) {
    throw new Error(getReviewApiErrorMessage(response, "리뷰를 불러오지 못했습니다."));
  }

  const data = (await response.json()) as BackendReview[];
  return data.map(normalizeReview);
};

export const createReview = async (
  payload: CreateReviewRequest,
  token: string
): Promise<Review> => {
  const response = await fetch(`${API_BASE_URL}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(getReviewApiErrorMessage(response, "리뷰 등록에 실패했습니다."));
  }

  return normalizeReview((await response.json()) as BackendReview);
};

export const fetchMyReviews = async (token: string): Promise<Review[]> => {
  const response = await fetch(`${API_BASE_URL}/review/your-review`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(getReviewApiErrorMessage(response, "작성한 리뷰를 불러오지 못했습니다."));
  }

  const data = (await response.json()) as BackendReview[];
  return data.map(normalizeReview);
};

export const deleteMyReview = async (reviewId: string, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/review/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(getReviewApiErrorMessage(response, "리뷰 삭제에 실패했습니다."));
  }
};
