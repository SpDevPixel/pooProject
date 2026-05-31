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
    @PostMapping("/favorites/{toilet_id}")
    public ResponseEntity<?> addFavorite(
            @PathVariable Long toilet_id,
            @RequestHeader("Authorization") String token  // 헤더에서 토큰 받기
    ) {
        Long Id = jwtUtil.extractId(token.replace("Bearer ", ""));
        favoriteService.addFavorite(Id, toilet_id);
        return ResponseEntity.ok().build();
    }

    //즐겨찾기 삭제
    @DeleteMapping("/favorites/{toilet_id}")
    public ResponseEntity<?> deleteFavorite(@PathVariable Long toilet_id,
                                            @RequestHeader("Authorization") String token){
        Long Id = jwtUtil.extractId(token.replace("Bearer ", ""));

        favoriteService.deleteFavorite(Id,toilet_id);

        return ResponseEntity.ok().build();
    }

    //즐겨찾기한 화장실 정보 전송
    @GetMapping("/toilets")
    public ResponseEntity<?> getFavoriteToilet(@RequestHeader("Authorization") String token){
        Long Id = jwtUtil.extractId(token.replace("Bearer ", ""));

        favoriteService.getUserFavoriteToilets(Id);

        return ResponseEntity.ok().build();
    }

}
