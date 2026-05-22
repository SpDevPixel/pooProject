package com.yeogi.toilet.emergency_toilet.user.service;

import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.repository.ToiletRepository;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.domain.UserFavorite;
import com.yeogi.toilet.emergency_toilet.user.dto.UserDto;
import com.yeogi.toilet.emergency_toilet.user.repository.UserFavoriteRepository;
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
    //아이디 사용 여부
    public boolean isUseId(String id){
        return userRepository.findByUserId(id).isEmpty();
    }


    //유저 데이터 저장
    public User addUserData(UserDto dto){
        User user = new User();

        String encodePassword = passwordEncoder.encode(dto.getPassword());

        user.setUserId(dto.getId());
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setAddress(dto.getAddress());
        user.setNickname(dto.getNickname());


        user.setPassword(encodePassword);
        return userRepository.save(user);
    }

    @Transactional
    public void changePw(Long id, String newPw){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
        String encodePassword = passwordEncoder.encode(newPw);
        user.setPassword(encodePassword);
    }

    @Transactional
    public void changeNn(Long id,String newNn){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
        user.setNickname(newNn);
    }

    public void deleteUser(Long id){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
        userRepository.delete(user);
    }

    //로그인 서비스
    public ResponseEntity<?> login(UserDto userDto){
        Optional<User> user = userRepository.findByUserId(userDto.getId());

        if(user.isEmpty()){
            return ResponseEntity.badRequest().body("계정이 없음");
        }

        if(!passwordEncoder.matches(userDto.getPassword(),user.get().getPassword())){
            return ResponseEntity.badRequest().body("비밀번호 없음");
        }
        String token = jwtUtil.generateToken(user.get().getId(), user.get().getRole());
        return ResponseEntity.ok(Map.of("token", token));
    }
    //토큰 발생
    public ResponseEntity<?> getMyInfo(String token) {
        String pureToken = token.substring(7);
        Long id = jwtUtil.extractId(pureToken);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        return ResponseEntity.ok(user);
    }

}
