/*
 * 파일 위치: src/app/types/notice.ts
 * 상위 폴더: src/app/types (공유 TypeScript 타입)
 * 역할: 공지사항 화면과 관리자 공지 관리에서 사용하는 타입 정의입니다.
 */
export type NoticeCategory = "서비스" | "점검" | "이벤트" | "안내";

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  author: string;
  createdAt: string;
  viewCount: number;
  isImportant: boolean;
}
