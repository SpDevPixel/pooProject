/*
 * 파일 위치: frontend/src/app/api/notices.ts
 * 역할: 공지사항 API 호출, 응답 정규화
 */
import type { Notice } from "../types/notice";

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "/api";

type BackendNotice = {
  id?: number | string | null;
  title?: string | null;
  content?: string | null;
  author?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

// 날짜 포맷
const formatDate = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// 오늘 날짜
const getToday = () =>
  new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

// 응답 정규화
const normalizeNotice = (notice: BackendNotice, useTodayFallback = false): Notice => ({
  id: String(notice.id ?? ""),
  title: notice.title ?? "제목 없음",
  content: notice.content ?? "",
  author: notice.author ?? "관리자",
  createdAt: formatDate(notice.createdAt ?? notice.updatedAt) || (useTodayFallback ? getToday() : ""),
  updatedAt: formatDate(notice.updatedAt),
});

// 오류 메시지 변환
const getNoticeApiErrorMessage = (response: Response, fallback: string) => {
  if (response.status === 401 || response.status === 403) {
    return "관리자 권한이 없거나 로그인이 만료되었습니다.";
  }

  if (response.status >= 500) {
    return "서버에서 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  return fallback;
};

// 공지 목록 조회
export const fetchNotices = async (): Promise<Notice[]> => {
  const response = await fetch(`${API_BASE_URL}/notice/all`);

  if (!response.ok) {
    throw new Error(getNoticeApiErrorMessage(response, "공지사항을 불러오지 못했습니다."));
  }

  const data = (await response.json()) as BackendNotice[];

  return data
    .map((notice) => normalizeNotice(notice))
    .filter((notice) => notice.id)
    .sort((a, b) => Number(b.id) - Number(a.id));
};

// 단일 공지 조회
export const fetchNoticeById = async (noticeId: string): Promise<Notice | null> => {
  const notices = await fetchNotices();
  return notices.find((notice) => notice.id === noticeId) ?? null;
};

// 공지 등록
export const createNotice = async (
  payload: { title: string; content: string; author: string },
  token: string
): Promise<Notice> => {
  const response = await fetch(`${API_BASE_URL}/notice/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(getNoticeApiErrorMessage(response, "공지사항 등록에 실패했습니다."));
  }

  return normalizeNotice((await response.json()) as BackendNotice, true);
};

export const updateNotice = async (
  noticeId: string,
  payload: { title: string; content: string },
  token: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/notice/${encodeURIComponent(noticeId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(getNoticeApiErrorMessage(response, "공지사항 수정에 실패했습니다."));
  }
};

// 공지 삭제
export const deleteNotice = async (noticeId: string, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/notice/delete/${encodeURIComponent(noticeId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(getNoticeApiErrorMessage(response, "공지사항 삭제에 실패했습니다."));
  }
};
