package com.yeogi.toilet.emergency_toilet.user.controller;

import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.dto.UserDto;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import com.yeogi.toilet.emergency_toilet.user.service.FavoriteService;
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
    private final JwtUtil jwtUtil;

    //회원가입
    @PostMapping("/user-data")
    public void addUserData(@RequestBody UserDto dto){
        userService.addUserData(dto);
    }

    //이메일 중복 확인
    @GetMapping("/email")
    public ResponseEntity<Boolean> checkEmail(@RequestParam String email){
        return ResponseEntity.ok(userService.isUseEmail(email));
    }
    //닉네임 중복 확인
    @GetMapping("/nickname")
    public ResponseEntity<Boolean> checkNickname(@RequestParam String nickname){
        return ResponseEntity.ok(userService.isUseNickname(nickname));
    }
    //아이디 중복 확인
    @GetMapping("/id")
    public ResponseEntity<Boolean> checkid(@RequestParam String id){
        return ResponseEntity.ok(userService.isUseId(id));
    }

    //닉네임 변경
    @GetMapping("/change-nn")
    public ResponseEntity<String> changeNickname(
            @RequestHeader("Authorization") String token,
            @RequestParam String newNn){
        Long id = jwtUtil.extractId(token.substring(7));
        userService.changeNn(id,newNn);


        return ResponseEntity.ok("닉네임 변경 완료");
    }

    //로그인
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserDto userDto){
        return userService.login(userDto);
    }
    //토큰 발급
    @GetMapping("/my-info")
    public ResponseEntity<?> getMyInfo(@RequestHeader("Authorization") String token) {
        return userService.getMyInfo(token);
    }

    //비밀번호 변경
    @PatchMapping("/change-pw")
    public ResponseEntity<String> changePw(
            @RequestHeader("Authorization") String token,
            @RequestParam String newPw){

        Long id = jwtUtil.extractId(token.substring(7));
        userService.changePw(id, newPw);
        return ResponseEntity.ok("비밀번호 변경 완료");
    }

    //계정 삭제
    @DeleteMapping("/delete")
    public ResponseEntity<String> deleteUser(
            @RequestHeader("Authorization") String token){

        // 토큰에서 이메일 추출
        Long id = jwtUtil.extractId(token.substring(7));
        userService.deleteUser(id);
        return ResponseEntity.ok("회원 탈퇴 완료");
    }



}
