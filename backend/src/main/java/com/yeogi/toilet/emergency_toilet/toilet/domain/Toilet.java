package com.yeogi.toilet.emergency_toilet.toilet.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "toilets")
@Getter
@Setter
@NoArgsConstructor
public class Toilet {

    @Id
    @Column(name = "management_no")
    private String managementNo;

    private String name;
    private String roadAddress;
    private Double lat;
    private Double lng;
    private String openTime;
    private String openTimeDetail;
    private String managingOrg;
    private String phoneNumber;
    private String wasteDisposal;
    private Boolean hasDisabledFacility;
    private Boolean hasEmergencyBell;
    private Boolean hasDiaperTable;
    private Boolean hasEntranceCctv;

    // 공공 데이터 vs 이용자 등록 구분
    @Column(nullable = false)
    private Boolean isUserSubmitted = false;
}