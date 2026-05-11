package com.yeogi.toilet.emergency_toilet.user.controller;

import com.yeogi.toilet.emergency_toilet.user.service.FavoriteService;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/favorite")
@RequiredArgsConstructor
public class FavoriteController {

    private final JwtUtil jwtUtil;
    private final FavoriteService favoriteService;

    //즐겨찾기 등록
    @PostMapping("/favorites/{managementNo}")
    public ResponseEntity<?> addFavorite(
            @PathVariable String managementNo,
            @RequestHeader("Authorization") String token  // 헤더에서 토큰 받기
    ) {
        String userId = jwtUtil.extractId(token.replace("Bearer ", ""));
        favoriteService.addFavorite(userId, managementNo);
        return ResponseEntity.ok().build();
    }

    //즐겨찾기 삭제
    @DeleteMapping("/favorites/{managementNo}")
    public ResponseEntity<?> deleteFavorite(@PathVariable String managementNo,
                                            @RequestHeader("Authorization") String token){
        String userId = jwtUtil.extractId(token.replace("Bearer ", ""));

        favoriteService.deleteFavorite(userId,managementNo);

        return ResponseEntity.ok().build();
    }

    //즐겨찾기한 화장실 정보 전송
    @GetMapping("/toilets")
    public ResponseEntity<?> getFavoriteToilet(@RequestHeader("Authorization") String token){
        String userId = jwtUtil.extractId(token.replace("Bearer ", ""));

        favoriteService.getUserFavoriteToilets(userId);

        return ResponseEntity.ok().build();
    }

}
