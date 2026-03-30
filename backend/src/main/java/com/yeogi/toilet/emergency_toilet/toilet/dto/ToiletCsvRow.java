package com.yeogi.toilet.emergency_toilet.toilet.dto;

import com.opencsv.bean.CsvBindByName;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ToiletCsvRow {

    @CsvBindByName(column = "관리번호")
    private String managementNo;

    private String userId;

    @CsvBindByName(column = "화장실명")
    private String name;

    @CsvBindByName(column = "소재지도로명주소")
    private String roadAddress;

    @CsvBindByName(column = "WGS84위도")
    private String lat;

    @CsvBindByName(column = "WGS84경도")
    private String lng;

    @CsvBindByName(column = "개방시간")
    private String openTime;

    @CsvBindByName(column = "개방시간상세")
    private String openTimeDetail;

    @CsvBindByName(column = "관리기관명")
    private String managingOrg;

    @CsvBindByName(column = "전화번호")
    private String phoneNumber;

    @CsvBindByName(column = "오물처리방식")
    private String wasteDisposal;

    @CsvBindByName(column = "남성용-장애인용대변기수")
    private String maleDisabledToilet;

    @CsvBindByName(column = "남성용-장애인용소변기수")
    private String maleDisabledUrinal;

    @CsvBindByName(column = "여성용-장애인용대변기수")
    private String femaleDisabledToilet;

    @CsvBindByName(column = "비상벨설치여부")
    private String emergencyBell;

    @CsvBindByName(column = "기저귀교환대유무")
    private String diaperTable;

    @CsvBindByName(column = "화장실입구CCTV설치유무")
    private String entranceCctv;
}