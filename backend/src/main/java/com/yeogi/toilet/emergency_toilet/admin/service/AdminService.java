package com.yeogi.toilet.emergency_toilet.admin.service;


import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;

    public List<User> getAllUsers(Long id){
        User admin = userRepository.findById(id).orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        if (!admin.getRole().equals("ADMIN")) { // 에러 메세지나 권한 비교는 프로젝트 구조에 맞게 변경
            throw new RuntimeException("관리자 권한이 없습니다.");
        }

        return userRepository.findAll();

    }

    @Transactional
    public void adminWithdrawUser(Long id, Long targetUserId){
        User admin = userRepository.findById(id).orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        if (!admin.getRole().equals("ADMIN")) { // 에러 메세지나 권한 비교는 프로젝트 구조에 맞게 변경
            throw new RuntimeException("관리자 권한이 없습니다.");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("탈퇴시키려는 유저를 찾을 수 없습니다."));

        userRepository.delete(targetUser);
    }


}
