/*
 * 파일 위치: src/app/data/mockNotices.ts
 * 상위 폴더: src/app/data (샘플 데이터)
 * 역할: 백엔드 연결 전 공지사항 목록과 상세 화면에 보여줄 샘플 데이터입니다.
 */
import { Notice } from "../types/notice";

export const mockNotices: Notice[] = [
  {
    id: "notice-1",
    title: "화장실 급할 때 서비스 베타 오픈 안내",
    content:
      "현재 위치 기반 화장실 검색, 즐겨찾기, 리뷰 기능을 먼저 사용할 수 있습니다. 이용 중 불편한 점은 관리자에게 알려주세요.",
    category: "서비스",
    author: "관리자",
    createdAt: "2026-05-08",
    viewCount: 128,
    isImportant: true,
  },
  {
    id: "notice-2",
    title: "공공 데이터 동기화 점검 예정",
    content:
      "공공 화장실 데이터 최신화를 위한 점검이 예정되어 있습니다. 점검 중에도 기존 지도와 검색 기능은 정상적으로 이용할 수 있습니다.",
    category: "점검",
    author: "관리자",
    createdAt: "2026-05-07",
    viewCount: 74,
    isImportant: true,
  },
  {
    id: "notice-3",
    title: "사용자 등록 화장실 검수 기준 안내",
    content:
      "사용자가 등록한 화장실은 위치, 주소, 이용 가능 시간, 시설 정보를 기준으로 관리자 검수를 거친 뒤 공개됩니다.",
    category: "안내",
    author: "운영팀",
    createdAt: "2026-05-05",
    viewCount: 56,
    isImportant: false,
  },
  {
    id: "notice-4",
    title: "리뷰 작성 이벤트 준비 중",
    content:
      "깨끗하고 이용하기 좋은 화장실 정보를 함께 모으기 위한 리뷰 이벤트를 준비하고 있습니다. 자세한 내용은 추후 공지됩니다.",
    category: "이벤트",
    author: "운영팀",
    createdAt: "2026-05-01",
    viewCount: 43,
    isImportant: false,
  },
];
