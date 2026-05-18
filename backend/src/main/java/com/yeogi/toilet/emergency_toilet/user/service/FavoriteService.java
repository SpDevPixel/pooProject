package com.yeogi.toilet.emergency_toilet.user.service;


import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.repository.ToiletRepository;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.domain.UserFavorite;
import com.yeogi.toilet.emergency_toilet.user.repository.UserFavoriteRepository;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RequiredArgsConstructor
@Slf4j
@Service
public class FavoriteService {
    private final UserRepository userRepository;
    private final UserFavoriteRepository favoriteRepository;
    private final ToiletRepository toiletRepository;

    //화장실 즐겨찾기
    public void addFavorite(Long Id, String managementNo) {

        User user = userRepository.findById(Id)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        Toilet toilet = toiletRepository.findById(managementNo)
                .orElseThrow(() -> new RuntimeException("화장실을 찾을 수 없습니다."));

        // 3. 중복 체크
        if (favoriteRepository.existsByUserAndToilet(user, toilet)) {
            throw new RuntimeException("이미 즐겨찾기한 화장실입니다.");
        }

        UserFavorite favorite = new UserFavorite();
        favorite.setUser(user);
        favorite.setToilet(toilet);

        favoriteRepository.save(favorite);
    }

    //화장실 즐겨찾기 취소
    public void deleteFavorite(Long Id, String managementNo) {
        User user = userRepository.findById(Id)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        Toilet toilet = toiletRepository.findById(managementNo)
                .orElseThrow(() -> new RuntimeException("화장실을 찾을 수 없습니다."));
        if (!favoriteRepository.existsByUserAndToilet(user, toilet)) {
            throw new RuntimeException("즐겨찾기한 화장실이 아닙니다.");
        }

        favoriteRepository.deleteByUserAndToilet(user, toilet);

    }
    //이용자가 즐겨찾기한 화장실 데이터 전송
    @Transactional(readOnly = true)
    public List<Toilet> getUserFavoriteToilets(String userId) {
        return favoriteRepository.findToiletsByUserId(userId);
    }

}
