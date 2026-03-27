package com.yeogi.toilet.emergency_toilet.review.controller;

import com.yeogi.toilet.emergency_toilet.review.domain.Review;
import com.yeogi.toilet.emergency_toilet.review.dto.ReviewDto;
import com.yeogi.toilet.emergency_toilet.review.repository.ReviewRepository;
import com.yeogi.toilet.emergency_toilet.review.service.ReviewService;
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

    //리뷰 데이터 전송
    @GetMapping("/{managementNo}")
    public ResponseEntity<List<Review>> getReviews(@PathVariable String managementNo) {
        return ResponseEntity.ok(reviewService.getReviewsByToilet(managementNo));
    }

    //리뷰 데이터 저장
    @PostMapping
    public ResponseEntity<Review> addReview(@RequestBody ReviewDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.addReview(dto));
    }

//    @GetMapping("/your-review")
//    public ResponseEntity<List<Review>> getUserReviews(@RequestHeader("Authorization") String token){
//
//    }

}
