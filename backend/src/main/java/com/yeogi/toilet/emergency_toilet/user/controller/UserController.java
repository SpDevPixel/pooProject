package com.yeogi.toilet.emergency_toilet.user.controller;

import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.dto.LoginDto;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import com.yeogi.toilet.emergency_toilet.user.service.UserService;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    //회원가입
    @PostMapping("/user-data")
    public void addUserData(@RequestBody User user){
        userService.addUserData(user);
    }
    //이메일 중복 확인
    @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmail(@RequestParam String email){
        return ResponseEntity.ok(userService.isUseEmail(email));
    }
    //닉네임 중복 확인
    @GetMapping("/check-nickname")
    public ResponseEntity<Boolean> checkNickname(@RequestParam String nickname){
        return ResponseEntity.ok(userService.isUseNickname(nickname));
    }

    //로그인
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDto loginDto){
        return userService.login(loginDto);
    }
    //토큰 발급
    @GetMapping("/my-info")
    public ResponseEntity<?> getMyInfo(
            @RequestHeader("Authorization") String token) {
        return userService.getMyInfo(token);
    }

    @PatchMapping("/change-pw")
    public ResponseEntity<String> changePw(
            @RequestHeader("Authorization") String token,
            @RequestParam String newPw){

        String email = jwtUtil.extractEmail(token.substring(7));
        userService.changePw(email, newPw);
        return ResponseEntity.ok("비밀번호 변경 완료");
    }

    @DeleteMapping("/delete")
    public ResponseEntity<String> deleteUser(
            @RequestHeader("Authorization") String token){

        // 토큰에서 이메일 추출
        String email = jwtUtil.extractEmail(token.substring(7));
        userService.deleteUser(email);
        return ResponseEntity.ok("회원 탈퇴 완료");
    }

}
