package com.yeogi.toilet.emergency_toilet.user.repository;

import com.yeogi.toilet.emergency_toilet.user.domain.UserFavorite;
import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {

    // 중복 체크
    boolean existsByUserAndToilet(User user, Toilet toilet);

    // 즐겨찾기 목록 조회
    List<UserFavorite> findByUser(User user);

    @Query("SELECT uf.toilet FROM UserFavorite uf WHERE uf.user.id = :id")
    List<Toilet> findToiletsByUserId(@Param("id") Long userId);

    // 즐겨찾기 해제
    @Modifying
    @Transactional // Repository 레벨 혹은 Service 레벨 둘 다 상관없지만 Service에 다 붙이는 게 안전합니다.
    @Query("DELETE FROM UserFavorite uf WHERE uf.user = :user AND uf.toilet = :toilet")
    void deleteByUserAndToilet(@Param("user") User user, @Param("toilet") Toilet toilet);


    @Modifying
    @Query("DELETE FROM UserFavorite f WHERE f.toilet.id = :toiletId")
    void deleteByToiletId(@Param("toiletId") Long toiletId);
}