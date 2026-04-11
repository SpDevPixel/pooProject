package com.yeogi.toilet.emergency_toilet.user.repository;

import com.yeogi.toilet.emergency_toilet.user.domain.UserFavorite;
import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {

    // 중복 체크
    boolean existsByUserAndToilet(User user, Toilet toilet);

    // 즐겨찾기 목록 조회
    List<UserFavorite> findByUser(User user);

    // 즐겨찾기 해제
    void deleteByUserAndToilet(User user, Toilet toilet);
}