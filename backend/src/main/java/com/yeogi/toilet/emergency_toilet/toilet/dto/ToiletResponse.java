package com.yeogi.toilet.emergency_toilet.toilet.dto;

import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ToiletResponse {

    private Long id;
    private String managementNo;
    private String name;
    private String roadAddress;
    private Double lat;
    private Double lng;
    private Boolean hasDiaperTable;
    private Double rating;

    public ToiletResponse(Toilet toilet) {
        this.id = toilet.getId();
        this.managementNo = toilet.getManagementNo();
        this.name = toilet.getName();
        this.roadAddress = toilet.getRoadAddress();
        this.lat = toilet.getLat();
        this.lng = toilet.getLng();
        this.hasDiaperTable = toilet.getHasDiaperTable();
        this.rating = toilet.getRating();
    }
}
