/*
 * 파일 위치: src/app/types/toilet.ts
 * 상위 폴더: src/app/types (공유 TypeScript 타입)
 * 역할: 화장실, 리뷰, 필터 등 앱 전반에서 공유하는 타입 정의입니다.
 */
export interface Toilet {
  id: string; // managementNo를 id로 사용
  managementNo: string;
  name: string;
  roadAddress: string;
  lat: number | null;
  lng: number | null;
  openTime?: string;
  openTimeDetail?: string;
  managingOrg?: string;
  phoneNumber?: string;
  wasteDisposal?: string;
  hasDisabledFacility: boolean;
  hasDiaperTable: boolean;
  hasEmergencyBell: boolean;
  hasEntranceCctv: boolean;
  isUserSubmitted: boolean;
  
  // 프론트엔드에서만 사용하는 임시 필드 (백엔드에는 저장되지 않음)
  rating?: number; // 평점 (리뷰 평균)
  reviewCount?: number; // 리뷰 개수
  distance?: number; // 현재 위치로부터의 거리 (미터)
}

export interface Review {
  id: string;
  toiletId: string;
  userId: string;
  userName: string;
  rating: number;
  cleanliness: number;
  hasTissuePaper: boolean;
  hasDoorLock: boolean;
  comment?: string;
  createdAt: Date;
}

export interface ToiletFilters {
  hasDisabledFacility: boolean;
  hasDiaperTable: boolean;
  hasEmergencyBell: boolean;
  hasEntranceCctv: boolean;
  isUserSubmitted: boolean | null;
}

export interface ToiletFormData {
  name: string;
  roadAddress: string;
  lat: number;
  lng: number;
  openTime: string;
  openTimeDetail: string;
  managingOrg: string;
  phoneNumber: string;
  wasteDisposal: string;
  hasDisabledFacility: boolean;
  hasDiaperTable: boolean;
  hasEmergencyBell: boolean;
  hasEntranceCctv: boolean;
}

export type RouteType = "optimal" | "highRated";

export interface NavigationRoute {
  type: RouteType;
  toilet: Toilet;
  distance: number;
  estimatedTime: number; // 분 단위
}
