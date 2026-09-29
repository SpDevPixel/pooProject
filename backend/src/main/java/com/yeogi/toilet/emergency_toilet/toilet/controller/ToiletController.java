package com.yeogi.toilet.emergency_toilet.toilet.controller;

import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletResponse;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletUpdateDto;
import com.yeogi.toilet.emergency_toilet.toilet.service.ToiletService;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/toilets")
@RequiredArgsConstructor
public class ToiletController {

    private final ToiletService toiletService;
    private final JwtUtil jwtUtil;

    // 공공데이터만 조회
    @GetMapping("/public")
    public List<Toilet> getPublic() {
        return toiletService.getPublicToilets();
    }

    // 이용자 데이터만 조회
    @GetMapping("/user")
    public List<Toilet> getUserToilets() {
        return toiletService.getUserToilets();
    }

    // 전체 조회
    @GetMapping("/all")
    public List<ToiletResponse> getAll() {
        return toiletService.getAllToilets();
    }

    // 이용자 화장실 등록
    @PostMapping("/user")
    public Toilet addUserToilet(@RequestBody Toilet toilet,@AuthenticationPrincipal Long loginUserId) {
        return toiletService.addUserToilet(toilet,loginUserId);
    }

    // 이용자가 등록한 화장실 정보들 조회
    @GetMapping("/userToilets")
    public ResponseEntity<List<Toilet>> sendUserToilets(@AuthenticationPrincipal Long loginUserId){
        return ResponseEntity.ok(toiletService.getUserToilets(loginUserId));
    }

//    //관리자의 화장실 정보 삭제
//    @DeleteMapping("/toilet/{managementNo}")
//    public ResponseEntity<Void> deleteToilet(@PathVariable String managementNo,
//                                             @AuthenticationPrincipal Long loginUserId){
//        if (token == null || !token.startsWith("Bearer ")) {
//            throw new RuntimeException("유효하지 않은 토큰");
//        }
//        String rawToken = token.substring(7);
//        String role = jwtUtil.extractRole(rawToken);
//
//        if(!"ADMIN".equals(role)){
//            throw new RuntimeException("관리자 권한이 없습니다");  // 추가!
//        }
//
//        toiletService.deleteAdminToilet(managementNo);
//        return ResponseEntity.noContent().build();
//    }

    //사용자의 화장실 정보 삭제
    @DeleteMapping("/toilet/{toiletId}")
    public ResponseEntity<Void> deleteToilet(@PathVariable Long toiletId,
                                             @AuthenticationPrincipal Long loginUserId){
        toiletService.deleteAToilet(toiletId,loginUserId);
        return ResponseEntity.noContent().build();
    }

    //화장실 정보 수정
    @PatchMapping("/{toiletId}")
    public ResponseEntity<Void> updateToilet(
            @PathVariable Long toiletId,
            @AuthenticationPrincipal Long loginUserId,
            @RequestBody ToiletUpdateDto updateDto) {
        toiletService.updateToiletInfo(toiletId, loginUserId, updateDto);
        return ResponseEntity.noContent().build();
    }

    //주소검색결과에 따른 화장실 정보 전송

    @GetMapping("/search")
    public ResponseEntity<List<Toilet>> searchToilets(@RequestParam("keyword") String keyword) {
        List<Toilet> results = toiletService.searchAddressToilet(keyword);

        if (results.isEmpty()) {
            return ResponseEntity.noContent().build(); // 결과가 없을 때 204 상태 코드
        }

        return ResponseEntity.ok(results); // 성공 시 200 상태 코드와 데이터 반환
    }

    @PatchMapping("/{toiletId}/reapply")
    public ResponseEntity<String> reapplyToilet(
            @PathVariable Long toiletId,
            @RequestBody ToiletUpdateDto dto,
            @AuthenticationPrincipal Long loginUserId) {
        try {
            toiletService.updateAndReapplyToilet(loginUserId, toiletId, dto);

            return ResponseEntity.ok("화장실 정보 수정 및 재요청이 완료되었습니다.");

        } catch (SecurityException e) {
            // 본인 글이 아닐 때 처리 (403 Forbidden)
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalStateException e) {
            // 반려 상태가 아닐 때 처리 (400 Bad Request)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            // 화장실 ID를 찾을 수 없을 때 처리 (404 Not Found)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            // 기타 서버 에러 처리 (500 Internal Server Error)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버 오류가 발생했습니다.");
        }
    }

}