package com.yeogi.toilet.emergency_toilet.admin.controller;

import com.yeogi.toilet.emergency_toilet.admin.service.AdminService;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final JwtUtil jwtUtil;

    @GetMapping("/user")
    public ResponseEntity<User> getUserifm(@RequestHeader("Authorization") String token){
        Long id = jwtUtil.extractId(token.substring(7));

    }


}
