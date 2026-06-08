package com.yeogi.toilet.emergency_toilet.admin.service;


import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
//    private final User user;

    public List<User> getUser(Long id){
        User admin = userRepository.findById(id).orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

//        if (!admin.getRole().equals()) { // 에러 메세지나 권한 비교는 프로젝트 구조에 맞게 변경
//            throw new RuntimeException("관리자 권한이 없습니다.");
//        }
    }


}
