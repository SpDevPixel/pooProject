package com.yeogi.toilet.emergency_toilet.admin.controller;

import com.yeogi.toilet.emergency_toilet.admin.service.AdminService;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final JwtUtil jwtUtil;

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
}
