package com.yeogi.toilet.emergency_toilet.toilet.controller;

import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletUpdateDto;
import com.yeogi.toilet.emergency_toilet.toilet.service.ToiletService;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
    public List<Toilet> getAll() {
        return toiletService.getAllToilets();
    }

    // 이용자 화장실 등록
    @PostMapping("/user")
    public Toilet addUserToilet(@RequestBody Toilet toilet,@RequestHeader("Authorization") String token) {
        return toiletService.addUserToilet(toilet,token);
    }

    // 이용자가 등록한 화장실 정보들 조회
    @GetMapping("/userToilets")
    public ResponseEntity<List<Toilet>> sendUserToilets(@RequestHeader("Authorization") String token){
        return ResponseEntity.ok(toiletService.getUserToilets(token));
    }

//    //관리자의 화장실 정보 삭제
//    @DeleteMapping("/toilet/{managementNo}")
//    public ResponseEntity<Void> deleteToilet(@PathVariable String managementNo,
//                                             @RequestHeader("Authorization") String token){
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
    @DeleteMapping("/toilet/{managementNo}")
    public ResponseEntity<Void> deleteToilet(@PathVariable String managementNo,
                                             @RequestHeader("Authorization") String token){
        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("유효하지 않은 토큰");
        }
        String rawToken = token.substring(7);
        Long id = jwtUtil.extractId(rawToken);
        toiletService.deleteAToilet(managementNo,id);


        return ResponseEntity.noContent().build();
    }

    //화장실 정보 수정
    @PatchMapping("/{managementNo}")
    public ResponseEntity<Void> updateToilet(
            @PathVariable String managementNo,
            @RequestHeader("Authorization") String token,
            @RequestBody ToiletUpdateDto updateDto) {

        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("유효하지 않은 인증 토큰입니다.");
        }

        String rawToken = token.substring(7);
        Long userSn = jwtUtil.extractId(rawToken);

        toiletService.updateToiletInfo(managementNo, userSn, updateDto);

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

}