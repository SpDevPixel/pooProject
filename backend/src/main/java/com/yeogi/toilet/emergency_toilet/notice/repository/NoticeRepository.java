package com.yeogi.toilet.emergency_toilet.notice.repository;

import com.yeogi.toilet.emergency_toilet.notice.domain.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    @Query("SELECT COUNT(n.id) FROM Notice n")
    Long noticeCount();

}
