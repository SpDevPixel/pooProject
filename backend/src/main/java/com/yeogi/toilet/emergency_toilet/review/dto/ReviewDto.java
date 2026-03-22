package com.yeogi.toilet.emergency_toilet.review.dto;

import lombok.Getter;

@Getter
public class ReviewDto {

    private String managementNo;   // 화장실 번호만 받음 (Toilet 객체 X)

    private int rating;
    private int cleanliness;
    private boolean hasTissuePaper;
    private boolean hasDoorLock;
    private String comment;

}
