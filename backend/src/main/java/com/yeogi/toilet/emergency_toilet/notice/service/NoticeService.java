package com.yeogi.toilet.emergency_toilet.notice.service;


import com.yeogi.toilet.emergency_toilet.notice.domain.Notice;
import com.yeogi.toilet.emergency_toilet.notice.repository.NoticeRepository;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    //공지사항 전체 전송
    public List<Notice> getNotices(){
        return noticeRepository.findAll();
    }

    public Long getNoticeCount(){
        return noticeRepository.noticeCount();
    }

    //공지사항 등록
    public Notice addNotice(Notice noticeDto,String token){
        String pureToken = token.substring(7);
        Long id = jwtUtil.extractId(pureToken);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        if(!"ADMIN".equals(user.getRole())){
            throw new RuntimeException("공지사항은 관리자만 등록할 수 있습니다.");
        }

        Notice notice = new Notice(noticeDto.getTitle(),noticeDto.getContent(),noticeDto.getAuthor());

        return noticeRepository.save(notice);

    }

    //공지사항 삭제
    public void deleteNotice(Long noticeId,String token){
        String pureToken = token.substring(7);
        Long id = jwtUtil.extractId(pureToken);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        if(!"ADMIN".equals(user.getRole())){
            throw new RuntimeException("공지사항은 관리자만 등록할 수 있습니다.");
        }

        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 공지사항입니다."));

        noticeRepository.delete(notice);

    }

    //공지사항 수정 & 업데이트
    @Transactional
    public void updateNotice(Long noticeId,Notice noticeDto,String token){
        String pureToken = token.substring(7);
        Long id = jwtUtil.extractId(pureToken);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        if(!"ADMIN".equals(user.getRole())){
            throw new RuntimeException("공지사항은 관리자만 등록할 수 있습니다.");
        }

        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 공지사항입니다."));

        notice.update(noticeDto.getTitle(),noticeDto.getContent());
    }
}
