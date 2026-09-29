package com.yeogi.toilet.emergency_toilet.user.controller;

import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.user.service.FavoriteService;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorite")
@RequiredArgsConstructor
public class FavoriteController {

    private final JwtUtil jwtUtil;
    private final FavoriteService favoriteService;

    //즐겨찾기 등록
    @PostMapping("/favorites/{toilet_id}")
    public ResponseEntity<?> addFavorite(
            @PathVariable Long toilet_id,
            @AuthenticationPrincipal Long loginUserId  // 헤더에서 토큰 받기
    ) {
        favoriteService.addFavorite(loginUserId, toilet_id);
        return ResponseEntity.ok().build();
    }

    //즐겨찾기 삭제
    @DeleteMapping("/favorites/{toilet_id}")
    public ResponseEntity<?> deleteFavorite(@PathVariable Long toilet_id,
                                            @AuthenticationPrincipal Long loginUserId){
        favoriteService.deleteFavorite(loginUserId,toilet_id);

        return ResponseEntity.ok().build();
    }

    //즐겨찾기한 화장실 정보 전송
    @GetMapping("/toilets")
    public ResponseEntity<List<Toilet>> getFavoriteToilet(@AuthenticationPrincipal Long loginUserId) {
        List<Toilet> favoriteToilets = favoriteService.getUserFavoriteToilets(loginUserId);

        return ResponseEntity.ok(favoriteToilets);
    }

}
