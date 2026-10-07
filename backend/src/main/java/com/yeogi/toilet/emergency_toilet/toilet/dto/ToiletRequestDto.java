package com.yeogi.toilet.emergency_toilet.toilet.dto;

import lombok.Getter;
import lombok.Setter;

import com.yeogi.toilet.emergency_toilet.toilet.domain.ToiletRequest;

@Getter
@Setter
public class ToiletRequestDto {
    private Long id;
    private Long toiletId;
    private Long requester;
    private Long approver;

    private boolean deleteToiletRequest;
    private boolean updateToiletRequest;

    private String content;
    private String status;

    public static ToiletRequestDto from(ToiletRequest request) {
        ToiletRequestDto dto = new ToiletRequestDto();
        dto.setId(request.getId());
        dto.setToiletId(request.getToilet() == null ? null : request.getToilet().getId());
        dto.setRequester(request.getRequester() == null ? null : request.getRequester().getId());
        dto.setApprover(request.getApprover() == null ? null : request.getApprover().getId());
        dto.setDeleteToiletRequest(request.isDeleteToiletRequest());
        dto.setUpdateToiletRequest(request.isUpdateToiletRequest());
        dto.setContent(request.getContent());
        dto.setStatus(request.getStatus());
        return dto;
    }

}


