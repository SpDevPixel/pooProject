package com.yeogi.toilet.emergency_toilet.review.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ReviewResponseDto {

    private Long reviewId;
    private int rating;
    private int cleanliness;
    private boolean hasTissuePaper;
    private boolean hasDoorLock;
    private String comment;
    private LocalDateTime createdAt;
    private String userNickname;
}
