package com.yeogi.toilet.emergency_toilet.toilet.service;


import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.domain.ToiletRequest;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletRequestDto;
import com.yeogi.toilet.emergency_toilet.toilet.repository.ToiletRepository;
import com.yeogi.toilet.emergency_toilet.toilet.repository.ToiletRequestRepository;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ToiletRequestService {

    private final JwtUtil jwtUtil;
    private final UserRepository UserRepository;
    private final ToiletRequestRepository toiletRequestRepository;
    private final ToiletRepository toiletRepository;

    //요청 사항 저장
    public ToiletRequest addToiletRequest(ToiletRequestDto dto, String token){
        String pureToken = token.substring(7);
        Long id = jwtUtil.extractId(pureToken); //

        User requesterUser = UserRepository.findById(dto.getRequester())
                .orElseThrow(() -> new RuntimeException("요청자 유저를 찾을 수 없습니다."));


        Toilet targetToilet = toiletRepository.findById(dto.getToiletId())
                .orElseThrow(() -> new RuntimeException("대상 화장실을 찾을 수 없습니다."));

        ToiletRequest request = new ToiletRequest();
        request.setRequester(requesterUser);
        request.setToilet(targetToilet);

        if (targetToilet.getIsUserSubmitted() != null && targetToilet.getIsUserSubmitted()) {
            request.setApprover(targetToilet.getUser());
        } else {
            User systemAdmin = UserRepository.findByRole("ADMIN")
                    .orElseThrow(() -> new RuntimeException("시스템에 등록된 관리자(ADMIN)가 없습니다."));
            request.setApprover(systemAdmin);
        }

        request.setDeleteToiletRequest(dto.isDeleteToiletRequest());
        request.setUpdateToiletRequest(dto.isUpdateToiletRequest());
        request.setContent(dto.getContent());
        request.setStatus("PENDING");

        return toiletRequestRepository.save(request);
    }

    public List<ToiletRequest> getMyReceivedDeleteRequests(String token) {
        String pureToken = token.substring(7);
        Long loginUserId = jwtUtil.extractId(pureToken);

        return toiletRequestRepository.findDeleteRequestsByApproverId(loginUserId);
    }

    // 나에게 온 수정 요청만 가져오기
    public List<ToiletRequest> getMyReceivedUpdateRequests(String token) {
        String pureToken = token.substring(7);
        Long loginUserId = jwtUtil.extractId(pureToken);

        return toiletRequestRepository.findUpdateRequestsByApproverId(loginUserId);
    }

    @org.springframework.transaction.annotation.Transactional
    public ToiletRequest rejectToiletRequest(Long requestId, String token) {

        String pureToken = token.substring(7);
        Long loginUserId = jwtUtil.extractId(pureToken);

        ToiletRequest request = toiletRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 요청 사항입니다."));

        if (!request.getApprover().getId().equals(loginUserId)) {
            throw new RuntimeException("이 요청을 거절할 권한이 없습니다.");
        }

        request.setStatus("REJECTED");

        return request;
    }

}
