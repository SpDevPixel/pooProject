package com.yeogi.toilet.emergency_toilet.admin.service;


import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.domain.ToiletStatus;
import com.yeogi.toilet.emergency_toilet.toilet.repository.ToiletRepository;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import com.yeogi.toilet.emergency_toilet.user.service.UserService;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final ToiletRepository toiletRepository;

    private final CacheManager cacheManager;

    public List<User> getAllUsers(){
        return userRepository.findAll();
    }

    @Transactional
    public void adminWithdrawUser(Long targetUserId){
        // 2. 강제 탈퇴 대상 유저 확인
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("탈퇴시키려는 유저를 찾을 수 없습니다."));

        // 3. UserService에 만들어둔 공통 탈퇴 로직 호출!
        userService.processUserWithdrawal(targetUser);
    }

    @Transactional
    public void approveToilet(Long toiletId, boolean isApproved) {
        Toilet toilet = toiletRepository.findById(toiletId)
                .orElseThrow(() -> new RuntimeException("화장실을 찾을 수 없습니다."));

        if (isApproved) {
            toilet.setStatus(ToiletStatus.APPROVED);

//            Cache cache = cacheManager.getCache("userToilets");
            Cache cache = cacheManager.getCache("userToilets");

            if (cache != null) {
                cache.clear();
            }

        } else {
            toilet.setStatus(ToiletStatus.REJECTED); // 반려 처리
        }
    }

    public List<Toilet> getPendingToilets() {
        return toiletRepository.findByStatus(ToiletStatus.PENDING);
    }


}
