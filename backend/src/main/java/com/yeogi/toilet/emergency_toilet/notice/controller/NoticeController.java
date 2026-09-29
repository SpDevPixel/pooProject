package com.yeogi.toilet.emergency_toilet.notice.controller;

import com.yeogi.toilet.emergency_toilet.notice.domain.Notice;
import com.yeogi.toilet.emergency_toilet.notice.service.NoticeService;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    //공지사항 갯수 전송
    @GetMapping("/count")
    public Long getNoticeCount() {
        return noticeService.getNoticeCount();
    }


    //공지사항 등록
    @PostMapping("/add")
    public Notice addNotice(@RequestBody Notice notice,@AuthenticationPrincipal Long loginUserId){
        return noticeService.addNotice(notice,loginUserId);
    }

    //공지사항 수정
    @PatchMapping("/{id}")
    public ResponseEntity<Void> updateNotice(@PathVariable Long id,@AuthenticationPrincipal Long loginUserId,
                                             @RequestBody Notice noticeDto){
        noticeService.updateNotice(id, noticeDto,loginUserId);

        return ResponseEntity.noContent().build();
    }

    //공지사항 삭제
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id,@AuthenticationPrincipal Long loginUserId){
        noticeService.deleteNotice(id,loginUserId);

        return ResponseEntity.noContent().build();
    }





}
