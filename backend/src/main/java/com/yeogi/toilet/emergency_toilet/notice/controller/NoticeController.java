package com.yeogi.toilet.emergency_toilet.notice.controller;

import com.yeogi.toilet.emergency_toilet.notice.domain.Notice;
import com.yeogi.toilet.emergency_toilet.notice.service.NoticeService;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notice")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;
    private final JwtUtil jwtUtil;

    //공지사항 전체 전송
    @GetMapping("/all")
    public List<Notice> getNotices(){
        return noticeService.getNotices();
    }

    //공지사항 등록
    @PostMapping("/add")
    public Notice addNotice(@RequestBody Notice notice,@RequestHeader("Authorization") String token){
        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("유효하지 않은 토큰");
        }

        return noticeService.addNotice(notice,token);
    }

    //공지사항 수정
    @PatchMapping("/{id}")
    public ResponseEntity<Void> updateNotice(@PathVariable Long id,@RequestHeader("Authorization") String token,
                                             @RequestBody Notice noticeDto){
        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("유효하지 않은 토큰");
        }
        noticeService.updateNotice(id, noticeDto,token);

        return ResponseEntity.noContent().build();
    }

    //공지사항 삭제
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id,@RequestHeader("Authorization") String token){
        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("유효하지 않은 토큰");
        }
        noticeService.deleteNotice(id,token);

        return ResponseEntity.noContent().build();
    }





}
