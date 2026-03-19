package com.yeogi.toilet.emergency_toilet.toilet.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "toilet")
@Getter
@Setter
@NoArgsConstructor
public class Toilet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String managementNo;       // 관리번호 (중복 방지 키)

    private String name;               // 화장실명
    private String roadAddress;        // 소재지도로명주소
    private Double lat;                // WGS84위도
    private Double lng;                // WGS84경도

    private String openTime;           // 개방시간
    private String openTimeDetail;     // 개방시간상세
    private String managingOrg;        // 관리기관명
    private String phoneNumber;        // 전화번호
    private String wasteDisposal;      // 오물처리방식

    private Boolean hasDisabledFacility;  // 장애인 시설
    private Boolean hasEmergencyBell;     // 비상벨
    private Boolean hasDiaperTable;       // 기저귀 교환대
    private Boolean hasEntranceCctv;      // 입구 CCTV
}
