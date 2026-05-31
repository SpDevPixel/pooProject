package com.yeogi.toilet.emergency_toilet.review.dto;

import lombok.Getter;

@Getter
public class ReviewDto {

    private Long toiletId;

    private int rating;
    private int cleanliness;
    private boolean hasTissuePaper;
    private boolean hasDoorLock;
    private String comment;

}
