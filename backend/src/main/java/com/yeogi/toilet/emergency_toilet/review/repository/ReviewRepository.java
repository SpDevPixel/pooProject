package com.yeogi.toilet.emergency_toilet.review.repository;

import com.yeogi.toilet.emergency_toilet.review.domain.Review;
import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // 특정 화장실의 모든 리뷰 조회
    List<Review> findByToilet_ManagementNo(String managementNo);
    List<Review> findByUser_Id(Long id);

    @Modifying
    @Query("DELETE FROM Review r WHERE r.toilet.id = :toiletId")
    void deleteByToiletId(@Param("toiletId") Long toiletId);


    void deleteByUser(User user);
    List<Review> findByUser(User user);

    @Modifying
    @Query("delete from Review r where r.toilet = :toilet")
    void deleteByToilet(@Param("toilet") Toilet toilet);
}