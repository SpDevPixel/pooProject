package com.yeogi.toilet.emergency_toilet.user.service;

import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.dto.LoginDto;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;


@RequiredArgsConstructor
@Slf4j
@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    //이메일 사용 여부
    public boolean isUseEmail(String email){
        return userRepository.findByEmail(email).isEmpty();
    }
    //닉네임 사용 여부
    public boolean isUseNickname(String nickname){
        return userRepository.findByNickname(nickname).isEmpty();
    }
    //유저 데이터 저장
    public User addUserData(User user){
        String encodePassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encodePassword);
        return userRepository.save(user);
    }

    @Transactional
    public void changePw(String email, String newPw){
        User user = userRepository.findByEmail(email).get();
        String encodePassword = passwordEncoder.encode(newPw);
        user.setPassword(encodePassword);
    }

    public void deleteUser(String email){
        User user = userRepository.findByEmail(email).get();
        userRepository.delete(user);
    }

    //로그인 서비스
    public ResponseEntity<?> login(LoginDto loginDto){
        Optional<User> user = userRepository.findByEmail(loginDto.getEmail());

        if(user.isEmpty()){
            return ResponseEntity.badRequest().body("이메일 없음");
        }

        if(!passwordEncoder.matches(loginDto.getPassword(),user.get().getPassword())){
            return ResponseEntity.badRequest().body("비밀번호 없음");
        }
        String token = jwtUtil.generateToken(user.get().getEmail());
        return ResponseEntity.ok(Map.of("token", token));
    }
    //토큰 발생
    public ResponseEntity<?> getMyInfo(String token) {
        String pureToken = token.substring(7);
        String email = jwtUtil.extractEmail(pureToken);
        User user = userRepository.findByEmail(email).get();
        return ResponseEntity.ok(user);
    }

}
