package com.yeogi.toilet.emergency_toilet.toilet.repository;

import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ToiletRepository extends JpaRepository<Toilet, Long> {
    Optional<Toilet> findByManagementNo(String managementNo);
}
