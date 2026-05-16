package com.yeogi.toilet.emergency_toilet.toilet.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ToiletApiRow {

    @JsonProperty("OBJECTID")
    private String managementNo; // 연번 (기존 관리번호 대체)

    @JsonProperty("CONTS_NAME")
    private String name; // 건물명 (화장실명으로 사용)

    @JsonProperty("ADDR_NEW")
    private String roadAddress; // 도로명주소

    @JsonProperty("ADDR_OLD")
    private String oldAddress; // 지번주소 (필요시 사용, 기존 DB에 없다면 스킵 가능)

    @JsonProperty("COORD_Y")
    private String lat; // y 좌표 (WGS84 위도)

    @JsonProperty("COORD_X")
    private String lng; // x 좌표 (WGS84 경도)

    @JsonProperty("TEL_NO")
    private String phoneNumber; // 전화번호

    @JsonProperty("VALUE_02")
    private String openTime; // 개방시간

    @JsonProperty("VALUE_05")
    private String disabledFacilityStatus; // 장애인화장실 현황 (파싱 필요)

    @JsonProperty("VALUE_06")
    private String convenienceFacilities; // 편의시설(기타설비) - 비상벨, 기저귀교환대 등 (파싱 필요)

    @JsonProperty("VALUE_08")
    private String managingOrg; // 소재지 (관리기관명으로 사용 가능성 높음)

    // 필요에 따라 VALUE_01, VALUE_03, VALUE_04 등도 추가할 수 있습니다.
}