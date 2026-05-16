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

    // String("Y"/"N") 대신 처음부터 Boolean으로 받기
    private Boolean emergencyBell;
    private Boolean diaperTable;
    private Boolean entranceCctv;
}