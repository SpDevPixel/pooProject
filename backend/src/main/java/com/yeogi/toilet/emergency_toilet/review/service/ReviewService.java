package com.yeogi.toilet.emergency_toilet.review.service;

import com.yeogi.toilet.emergency_toilet.review.domain.Review;
import com.yeogi.toilet.emergency_toilet.review.dto.ReviewDto;
import com.yeogi.toilet.emergency_toilet.review.repository.ReviewRepository;
import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.repository.ToiletRepository;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ToiletRepository toiletRepository;

    // 리뷰 데이터 저장
    @Transactional
    @CacheEvict(value = "allToilets",allEntries = true)
    public Review addReview(ReviewDto dto, Long userId) {
        Toilet toilet = toiletRepository.findById(dto.getToiletId())
                .orElseThrow(() -> new RuntimeException("화장실을 찾을 수 없습니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Review review = new Review();

        review.setUser(user);
        review.setToilet(toilet);

        review.setRating(dto.getRating());
        review.setCleanliness(dto.getCleanliness());
        review.setHasTissuePaper(dto.isHasTissuePaper());
        review.setComment(dto.getComment());
        review.setHasDoorLock(dto.isHasDoorLock());
        review.setCreatedAt(LocalDateTime.now());

        toilet.updateRatingWhenReviewAdded(dto.getRating());

        return reviewRepository.save(review);
    }

    // 화장실 리뷰 전달
    public List<Review> getReviewsByToilet(String managementNo) {
        return reviewRepository.findByToilet_ManagementNo(managementNo);
    }

    // 사용자가 작성한 리뷰 전달
    public List<Review> getReviewsByUser(Long id) {
        return reviewRepository.findByUserIdWithToilet(id);
    }

    // 사용자가 작성한 리뷰 삭제
    @CacheEvict(value = "allToilets",allEntries = true)
    @Transactional
    public void deleteUserReview(Long id, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("리뷰 없음"));

        if (!review.getUser().getId().equals(id)) {
            throw new RuntimeException("삭제 권한 없음");
        }

        Toilet toilet = review.getToilet();
        if (toilet != null) {
            toilet.updateRatingWhenReviewDeleted(review.getRating());
        }

        reviewRepository.delete(review);
    }

    // 관리자 권한으로 리뷰 삭제
//    @Transactional
//    public void deleteReviewByAdmin(Long reviewId){
//        Review review = reviewRepository.findById(reviewId)
//                .orElseThrow(() -> new RuntimeException("리뷰 없음"));
//        Toilet toilet = review.getToilet();
//        if (toilet != null) {
//            toilet.updateRatingWhenReviewDeleted(review.getRating());
//        }
//        // 소유자 확인 없이 바로 삭제
//        reviewRepository.delete(review);
//    }
}