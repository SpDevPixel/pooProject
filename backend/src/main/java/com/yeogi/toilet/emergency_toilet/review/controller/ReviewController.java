package com.yeogi.toilet.emergency_toilet.review.controller;

import com.yeogi.toilet.emergency_toilet.review.domain.Review;
import com.yeogi.toilet.emergency_toilet.review.dto.ReviewDto;
import com.yeogi.toilet.emergency_toilet.review.dto.ReviewResponseDto;
import com.yeogi.toilet.emergency_toilet.review.repository.ReviewRepository;
import com.yeogi.toilet.emergency_toilet.review.service.ReviewService;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final JwtUtil jwtUtil;

    //리뷰 데이터 전송
    @GetMapping("/{toilet_id}")
    public ResponseEntity<List<ReviewResponseDto>> getReviews(@PathVariable Long toilet_id) {
        return ResponseEntity.ok(reviewService.getReviewsByToilet(toilet_id));
    }

    @PostMapping
    public ResponseEntity<Review> addReview(
            @RequestBody ReviewDto dto,
            @AuthenticationPrincipal Long loginUserId) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.addReview(dto, loginUserId));
    }

    //유저의 리뷰 정보 전송
    @GetMapping("/your-review")
    public ResponseEntity<List<Review>> getUserReviews(@AuthenticationPrincipal Long loginUserId){
        return  ResponseEntity.ok(reviewService.getReviewsByUser(loginUserId));
    }

    //리뷰 삭제
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId,@AuthenticationPrincipal Long loginUserId){
        reviewService.deleteUserReview(loginUserId,reviewId);
        return ResponseEntity.noContent().build();
    }

}
