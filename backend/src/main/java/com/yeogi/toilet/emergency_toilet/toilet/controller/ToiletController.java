package com.yeogi.toilet.emergency_toilet.toilet.controller;

import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.service.ToiletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/toilets")
@RequiredArgsConstructor
public class ToiletController {

    private final ToiletService toiletService;

    // 공공데이터만 조회
    @GetMapping("/public")
    public List<Toilet> getPublic() {
        return toiletService.getPublicToilets();
    }

    // 이용자 데이터만 조회
    @GetMapping("/user")
    public List<Toilet> getUserToilets() {
        return toiletService.getUserToilets();
    }

    // 전체 조회
    @GetMapping("/all")
    public List<Toilet> getAll() {
        return toiletService.getAllToilets();
    }

    // 이용자 화장실 등록
    @PostMapping("/user")
    public Toilet addUserToilet(@RequestBody Toilet toilet,@RequestHeader("Authorization") String token) {
        return toiletService.addUserToilet(toilet,token);
    }

    // 이용자가 등록한 화장실 정보들 조회
    @GetMapping("/userToilets")
    public ResponseEntity<List<Toilet>> sendUserToilets(@RequestHeader("Authorization") String token){
        return ResponseEntity.ok(toiletService.getUserToilets(token));
    }
}