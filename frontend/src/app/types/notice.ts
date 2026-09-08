/* 공지사항 데이터가 프론트 전반에서 동일한 구조로 사용되도록 공용 타입을 정의합니다. */
export type NoticeCategory = "서비스" | "점검" | "이벤트" | "안내";

export interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
  category?: NoticeCategory;
  viewCount?: number;
  isImportant?: boolean;
}
