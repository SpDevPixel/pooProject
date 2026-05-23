package com.yeogi.toilet.emergency_toilet.notice.repository;

import com.yeogi.toilet.emergency_toilet.notice.domain.Notice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<Notice, Long> {



}
