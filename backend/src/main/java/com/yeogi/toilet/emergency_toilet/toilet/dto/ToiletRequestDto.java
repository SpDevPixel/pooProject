package com.yeogi.toilet.emergency_toilet.toilet.dto;

import lombok.Getter;

@Getter

public class ToiletRequestDto {
    private Long toiletId;
    private Long requester;
    private Long approver;

    private boolean deleteToiletRequest;
    private boolean updateToiletRequest;

    private String content;

}


