package com.yeogi.toilet.emergency_toilet.review.controller;

import com.yeogi.toilet.emergency_toilet.review.domain.Review;
import com.yeogi.toilet.emergency_toilet.review.dto.ReviewDto;
import com.yeogi.toilet.emergency_toilet.review.repository.ReviewRepository;
import com.yeogi.toilet.emergency_toilet.review.service.ReviewService;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<Review>> getReviews(@PathVariable String toilet_id) {
        return ResponseEntity.ok(reviewService.getReviewsByToilet(toilet_id));
    }

    @PostMapping
    public ResponseEntity<Review> addReview(
            @RequestHeader("Authorization") String token, // 1. 헤더에서 토큰 받기
            @RequestBody ReviewDto dto) {

        Long userId = jwtUtil.extractId(token.replace("Bearer ", ""));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.addReview(dto, userId));
    }

    //유저의 리뷰 정보 전송
    @GetMapping("/your-review")
    public ResponseEntity<List<Review>> getUserReviews(@RequestHeader("Authorization") String token){
        Long id = jwtUtil.extractId(token.substring(7));

        return  ResponseEntity.ok(reviewService.getReviewsByUser(id));
    }

    //리뷰 삭제
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId,@RequestHeader("Authorization") String token){
        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("유효하지 않은 토큰");
        }
        String rawToken = token.substring(7);
        Long id = jwtUtil.extractId(rawToken);
//        String role = jwtUtil.extractRole(rawToken);
//        if("ADMIN".equals(role)){
//            reviewService.deleteReviewByAdmin(reviewId);
//        }
//        else{
//
//        }
        reviewService.deleteUserReview(id,reviewId);

        return ResponseEntity.noContent().build();
    }

}
