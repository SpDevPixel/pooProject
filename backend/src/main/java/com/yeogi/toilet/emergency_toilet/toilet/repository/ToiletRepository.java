package com.yeogi.toilet.emergency_toilet.toilet.repository;

import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ToiletRepository extends JpaRepository<Toilet, String> {
    List<Toilet> findByIsUserSubmitted(Boolean isUserSubmitted);

    List<Toilet> findByUser(User user);

    @Query("SELECT t FROM Toilet t WHERE t.roadAddress LIKE %:keyword%")
    List<Toilet> findByAddressContaining(@Param("keyword") String keyword);
}