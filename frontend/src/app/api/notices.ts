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

const normalizeNotice = (notice: BackendNotice): Notice => ({
  id: String(notice.id ?? ""),
  title: notice.title ?? "제목 없음",
  content: notice.content ?? "",
  author: notice.author ?? "관리자",
  createdAt: formatDate(notice.createdAt),
  updatedAt: formatDate(notice.updatedAt),
});

export const fetchNotices = async (): Promise<Notice[]> => {
  const response = await fetch(`${API_BASE_URL}/notice/all`);

  if (!response.ok) {
    throw new Error("공지사항을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
  }

  const data = (await response.json()) as BackendNotice[];

  return data
    .map(normalizeNotice)
    .filter((notice) => notice.id)
    .sort((a, b) => Number(b.id) - Number(a.id));
};

export const fetchNoticeById = async (noticeId: string): Promise<Notice | null> => {
  const notices = await fetchNotices();
  return notices.find((notice) => notice.id === noticeId) ?? null;
};
