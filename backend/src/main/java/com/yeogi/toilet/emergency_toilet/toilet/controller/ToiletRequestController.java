package com.yeogi.toilet.emergency_toilet.toilet.controller;

import com.yeogi.toilet.emergency_toilet.toilet.domain.ToiletRequest;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletRequestDto;
import com.yeogi.toilet.emergency_toilet.toilet.service.ToiletRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class ToiletRequestController {

    private final ToiletRequestService toiletRequestService;

    //요청사항 저장
    @PostMapping("/add")
    public ResponseEntity<String> addToiletRequest(
            @RequestBody ToiletRequestDto dto,
            @AuthenticationPrincipal Long loginUserId) {

        toiletRequestService.addToiletRequest(dto, loginUserId);
        return ResponseEntity.ok("요청 사항이 성공적으로 등록되었습니다.");
    }

    //받는 사람이 "나한테 온 [삭제] 요청만 보여줘" 할 때 호출하는 API
    @GetMapping("/received/delete")
    public ResponseEntity<List<ToiletRequest>> getDeleteRequests(
            @AuthenticationPrincipal Long loginUserId) {

        List<ToiletRequest> requests = toiletRequestService.getMyReceivedDeleteRequests(loginUserId);
        return ResponseEntity.ok(requests);
    }

    //받는 사람이 "나한테 온 [수정] 요청만 보여줘" 할 때 호출하는 API
    @GetMapping("/received/update")
    public ResponseEntity<List<ToiletRequest>> getUpdateRequests(
            @AuthenticationPrincipal Long loginUserId) {

        List<ToiletRequest> requests = toiletRequestService.getMyReceivedUpdateRequests(loginUserId);
        return ResponseEntity.ok(requests);
    }

    //주인이 특정 요청을 거절(삭제)할 때 호출하는 API
    @PatchMapping("/{requestId}/reject")
    public ResponseEntity<String> rejectRequest(
            @PathVariable("requestId") Long requestId,
            @AuthenticationPrincipal Long loginUserId) {

        toiletRequestService.rejectToiletRequest(requestId, loginUserId);
        return ResponseEntity.ok("요청이 성공적으로 거절(삭제) 처리되었습니다.");
    }

    // 관리자가 처리 완료한 요청을 DB에서 삭제할 때 호출하는 API
    @DeleteMapping("/{requestId}/complete")
    public ResponseEntity<String> completeRequest(
            @PathVariable("requestId") Long requestId) {

        toiletRequestService.completeToiletRequest(requestId);
        return ResponseEntity.ok("요청이 처리 완료되어 삭제되었습니다.");
    }

}
