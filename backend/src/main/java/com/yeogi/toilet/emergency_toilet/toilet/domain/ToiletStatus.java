package com.yeogi.toilet.emergency_toilet.toilet.domain;

public enum ToiletStatus {
    PENDING,  // 승인 대기 중
    APPROVED, // 승인 완료 (지도에 노출됨)
    REJECTED  // 반려됨
}
