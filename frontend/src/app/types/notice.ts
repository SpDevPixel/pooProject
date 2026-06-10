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
