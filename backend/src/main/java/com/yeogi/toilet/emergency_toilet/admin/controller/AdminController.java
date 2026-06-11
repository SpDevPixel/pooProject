package com.yeogi.toilet.emergency_toilet.admin.controller;

import com.yeogi.toilet.emergency_toilet.admin.service.AdminService;
import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletUpdateDto;
import com.yeogi.toilet.emergency_toilet.toilet.service.ToiletService;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final JwtUtil jwtUtil;
    private final ToiletService toiletService;

    @GetMapping("/user")
    public ResponseEntity<List<User>> getAllUsers(@RequestHeader("Authorization") String token){
        Long id = jwtUtil.extractId(token.substring(7));

        List<User> users = adminService.getAllUsers(id);
        return ResponseEntity.ok(users);
    }

    @DeleteMapping("/admin/user/{targetUserId}")
    public ResponseEntity<String> forceWithdrawUser(
            @RequestHeader("Authorization") String token,
            @PathVariable("targetUserId") Long targetUserId // 강제 탈퇴시킬 유저의 ID
    ){
        Long id = jwtUtil.extractId(token.substring(7));

        adminService.adminWithdrawUser(id,targetUserId);

        return ResponseEntity.ok("회원이 성공적으로 강제 탈퇴 처리되었습니다.");
    }

    //승인 대기중 화장실 목록 조회
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingToilets(@RequestHeader("Authorization") String token){
        String pureToken = token.substring(7);
        String role = jwtUtil.extractRole(pureToken);
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("관리자만 접근 가능합니다.");
        }

        List<Toilet> pendingToilets = toiletService.getPendingToilets();
        return ResponseEntity.ok(pendingToilets);
    }

    //화장실 등록 요청 승인 처리
    @PatchMapping("/{toiletId}/approve")
    public ResponseEntity<String> approveToilet(
            @PathVariable Long toiletId,
            @RequestHeader("Authorization") String token) {

        String pureToken = token.substring(7);

        //1차 보안 가드
        String role = jwtUtil.extractRole(pureToken);
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("관리자 권한이 없습니다.");
        }

        Long adminId = jwtUtil.extractId(pureToken);
        adminService.approveToilet(adminId, toiletId, true);

        return ResponseEntity.ok("화장실 등록 요청이 승인되었습니다. 이제 지도에 노출됩니다.");
    }

    //화장실 등록 요청 반려
    @PatchMapping("/{toiletId}/reject")
    public ResponseEntity<String> rejectToilet(
            @PathVariable Long toiletId,
            @RequestHeader("Authorization") String token) {

        String pureToken = token.substring(7);

        // 💡 1차 보안 가드
        String role = jwtUtil.extractRole(pureToken);
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("관리자 권한이 없습니다.");
        }

        Long adminId = jwtUtil.extractId(pureToken);
        adminService.approveToilet(adminId, toiletId, false);

        return ResponseEntity.ok("화장실 등록 요청이 반려되었습니다.");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteToilet(@PathVariable Long id,
                                             @RequestHeader("Authorization") String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("유효하지 않은 토큰");
        }
        String rawToken = token.substring(7);
        String role = jwtUtil.extractRole(rawToken);

        if (!"ADMIN".equals(role)) {
            throw new RuntimeException("관리자 권한이 없습니다");
        }

        toiletService.deleteAdminToilet(id); // 💡 Long id 전달
        return ResponseEntity.noContent().build();
    }

    /**
     * 💡 관리자의 화장실 정보 수정 (ID 기준)
     * PUT /api/admin/toilets/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Void> updateToilet(@PathVariable Long id,
                                             @RequestBody ToiletUpdateDto dto,
                                             @RequestHeader("Authorization") String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("유효하지 않은 토큰");
        }
        String rawToken = token.substring(7);
        String role = jwtUtil.extractRole(rawToken);

        if (!"ADMIN".equals(role)) {
            throw new RuntimeException("관리자 권한이 없습니다");
        }

        toiletService.updateAdminToilet(id, dto); // 💡 Long id 전달
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<?> getAllToiletsForAdmin(@RequestHeader("Authorization") String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("유효하지 않은 토큰");
        }
        String rawToken = token.substring(7);
        String role = jwtUtil.extractRole(rawToken);
        
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("관리자만 접근 가능합니다.");
        }

        // 서비스에서 상태 상관없이 전체 리스트 가져오기
        List<Toilet> allToilets = toiletService.getAllToiletsForAdmin();
        return ResponseEntity.ok(allToilets);
    }
}
