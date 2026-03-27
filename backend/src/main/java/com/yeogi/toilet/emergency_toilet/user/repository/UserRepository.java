package com.yeogi.toilet.emergency_toilet.user.repository;

import com.yeogi.toilet.emergency_toilet.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByNickname(String nickname);
}
