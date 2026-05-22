package com.yeogi.toilet.emergency_toilet.review.repository;

import com.yeogi.toilet.emergency_toilet.review.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // 특정 화장실의 모든 리뷰 조회
    List<Review> findByToilet_ManagementNo(String managementNo);
    List<Review> findByUser_Id(Long id);
}