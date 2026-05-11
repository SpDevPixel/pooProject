/*
 * 파일 위치: src/app/data/mockUsers.ts
 * 상위 폴더: src/app/data (샘플 데이터)
 * 역할: 관리자 페이지에서 회원 현황을 보여주기 위한 샘플 사용자 데이터입니다.
 */
export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "관리자" | "회원";
  status: "활성" | "정지";
  joinedAt: string;
  reviewCount: number;
}

export const mockUsers: MockUser[] = [
  {
    id: "user-1",
    name: "관리자",
    email: "admin@toilet.local",
    role: "관리자",
    status: "활성",
    joinedAt: "2026-04-20",
    reviewCount: 0,
  },
  {
    id: "user-2",
    name: "강남러",
    email: "gangnam@example.com",
    role: "회원",
    status: "활성",
    joinedAt: "2026-05-02",
    reviewCount: 12,
  },
  {
    id: "user-3",
    name: "서초탐험가",
    email: "seocho@example.com",
    role: "회원",
    status: "활성",
    joinedAt: "2026-05-06",
    reviewCount: 5,
  },
];
