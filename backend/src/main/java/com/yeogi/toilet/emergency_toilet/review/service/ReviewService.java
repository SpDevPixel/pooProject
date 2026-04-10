package com.yeogi.toilet.emergency_toilet.review.service;

import com.yeogi.toilet.emergency_toilet.review.domain.Review;
import com.yeogi.toilet.emergency_toilet.review.dto.ReviewDto;
import com.yeogi.toilet.emergency_toilet.review.repository.ReviewRepository;
import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.repository.ToiletRepository;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewrepository;
    private final ToiletRepository toiletRepository;
    private final UserRepository userRepository;

    //리뷰 데이터 저장
    public Review addReview(ReviewDto dto){
        Toilet toilet = toiletRepository.findById
                (dto.getManagementNo()).orElseThrow(() -> new RuntimeException("화장실을 찾을 수 없습니다."));

        Review review = new Review();

        review.setToilet(toilet);
        review.setRating(dto.getRating());
        review.setCleanliness(dto.getCleanliness());
        review.setHasTissuePaper(dto.isHasTissuePaper());
        review.setComment(dto.getComment());
        review.setHasDoorLock(dto.isHasDoorLock());
        review.setCreatedAt(LocalDateTime.now());
        return reviewrepository.save(review);
    }

    //화장실 리뷰 전달
    public List<Review> getReviewsByToilet(String managementNo) {
        return reviewrepository.findByToilet_ManagementNo(managementNo);
    }

    //사용자가 작성한 리뷰 전달
    public List<Review> getReviewsByUser(String id){
        return reviewrepository.findByUser_Id(id);
    }

    //사용자가 작성한 리뷰 삭제
    public  void deleteUserReview(String id, Long reviewId){
        Review review = reviewrepository.findById(reviewId).orElseThrow(() -> new RuntimeException("리뷰 없음"));

        if(!review.getUser().getId().equals(id)){
            throw new RuntimeException("삭제 권한 없음");
        }

        reviewrepository.delete(review);
    }

    //관리자 권한으로 리뷰 삭제
//    public void deleteReviewByAdmin(Long reviewId){
//        Review review = reviewrepository.findById(reviewId)
//                .orElseThrow(() -> new RuntimeException("리뷰 없음"));
//
//        // 소유자 확인 없이 바로 삭제
//        reviewrepository.delete(review);
//    }

}
