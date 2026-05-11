package com.yeogi.toilet.emergency_toilet.toilet.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ToiletUpdateDto {
    private String openTime;
    private String openTimeDetail;
    private String managingOrg;
    private String phoneNumber;
    private String wasteDisposal;
    private String emergencyBell; // 필요 시 Boolean으로 변환 로직 추가
    private String diaperTable;
    private String entranceCctv;
}