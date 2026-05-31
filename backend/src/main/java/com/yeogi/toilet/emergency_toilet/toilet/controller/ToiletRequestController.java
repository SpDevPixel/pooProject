package com.yeogi.toilet.emergency_toilet.toilet.controller;

import com.yeogi.toilet.emergency_toilet.toilet.domain.ToiletRequest;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletRequestDto;
import com.yeogi.toilet.emergency_toilet.toilet.service.ToiletRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
            @RequestHeader("Authorization") String token) {

        toiletRequestService.addToiletRequest(dto, token);
        return ResponseEntity.ok("요청 사항이 성공적으로 등록되었습니다.");
    }

    //받는 사람이 "나한테 온 [삭제] 요청만 보여줘" 할 때 호출하는 API
    @GetMapping("/received/delete")
    public ResponseEntity<List<ToiletRequest>> getDeleteRequests(
            @RequestHeader("Authorization") String token) {

        List<ToiletRequest> requests = toiletRequestService.getMyReceivedDeleteRequests(token);
        return ResponseEntity.ok(requests);
    }

    //받는 사람이 "나한테 온 [수정] 요청만 보여줘" 할 때 호출하는 API
    @GetMapping("/received/update")
    public ResponseEntity<List<ToiletRequest>> getUpdateRequests(
            @RequestHeader("Authorization") String token) {

        List<ToiletRequest> requests = toiletRequestService.getMyReceivedUpdateRequests(token);
        return ResponseEntity.ok(requests);
    }

    //관리자/주인이 특정 요청을 거절(삭제)할 때 호출하는 API
    @PatchMapping("/{requestId}/reject")
    public ResponseEntity<String> rejectRequest(
            @PathVariable("requestId") Long requestId,
            @RequestHeader("Authorization") String token) {

        toiletRequestService.rejectToiletRequest(requestId, token);
        return ResponseEntity.ok("요청이 성공적으로 거절(삭제) 처리되었습니다.");
    }

}
