package com.yeogi.toilet.emergency_toilet.toilet.repository;

import com.yeogi.toilet.emergency_toilet.user.domain.UserFavorite;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ToiletRequestRepository extends JpaRepository<UserFavorite, Long> {



}
