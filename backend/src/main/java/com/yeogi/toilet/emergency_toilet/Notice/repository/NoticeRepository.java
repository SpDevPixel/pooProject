package com.yeogi.toilet.emergency_toilet.Notice.repository;

import com.yeogi.toilet.emergency_toilet.Notice.domain.Notice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<Notice, Long> {



}
