package com.yeogi.toilet.emergency_toilet.admin.controller;

import com.yeogi.toilet.emergency_toilet.admin.service.AdminService;
import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletUpdateDto;
import com.yeogi.toilet.emergency_toilet.toilet.service.ToiletService;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final ToiletService toiletService;

    @GetMapping("/user")
    public ResponseEntity<List<User>> getAllUsers(){
        List<User> users = adminService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @DeleteMapping("/admin/user/{targetUserId}")
    public ResponseEntity<String> forceWithdrawUser(
            @PathVariable("targetUserId") Long targetUserId // 강제 탈퇴시킬 유저의 ID
    ){
        adminService.adminWithdrawUser(targetUserId);

        return ResponseEntity.ok("회원이 성공적으로 강제 탈퇴 처리되었습니다.");
    }

    //승인 대기중 화장실 목록 조회
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingToilets(){
        List<Toilet> pendingToilets = toiletService.getPendingToilets();
        return ResponseEntity.ok(pendingToilets);
    }

    //화장실 등록 요청 승인 처리
    @PatchMapping("/{toiletId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> approveToilet(@PathVariable Long toiletId) {
        adminService.approveToilet(toiletId, true);

        return ResponseEntity.ok("화장실 등록 요청이 승인되었습니다. 이제 지도에 노출됩니다.");
    }

    //화장실 등록 요청 반려
    @PatchMapping("/{toiletId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> rejectToilet(@PathVariable Long toiletId) {
        adminService.approveToilet(toiletId, false);

        return ResponseEntity.ok("화장실 등록 요청이 반려되었습니다.");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteToilet(@PathVariable Long id) {
        toiletService.deleteAdminToilet(id); //
        return ResponseEntity.noContent().build();
    }

    /**
     * 💡 관리자의 화장실 정보 수정 (ID 기준)
     * PUT /api/admin/toilets/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateToilet(@PathVariable Long id,
                                             @RequestBody ToiletUpdateDto dto) {
        toiletService.updateAdminToilet(id, dto); // 💡 Long id 전달
        return ResponseEntity.ok().build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllToiletsForAdmin() {
        // 서비스에서 상태 상관없이 전체 리스트 가져오기
        List<Toilet> allToilets = toiletService.getAllToiletsForAdmin();
        return ResponseEntity.ok(allToilets);
    }
}
