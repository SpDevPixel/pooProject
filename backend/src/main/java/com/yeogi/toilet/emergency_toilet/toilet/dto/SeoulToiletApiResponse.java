package com.yeogi.toilet.emergency_toilet.toilet.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SeoulToiletApiResponse {
    // 기존 SearchPublicToiletPOIService에서 mgisToiletPoi로 변경
    @JsonProperty("mgisToiletPoi")
    private ToiletServiceResult serviceResult;

    @Getter
    @Setter
    public static class ToiletServiceResult {
        @JsonProperty("list_total_count")
        private int listTotalCount;

        @JsonProperty("row")
        private List<ToiletApiRow> row;
    }
}

