package com.yeogi.toilet.emergency_toilet.toilet.repository;

import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.domain.ToiletStatus;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ToiletRepository extends JpaRepository<Toilet, Long> {
    List<Toilet> findByIsUserSubmitted(Boolean isUserSubmitted);

    List<Toilet> findByIsUserSubmittedAndStatus(Boolean isUserSubmitted, ToiletStatus status);

    List<Toilet> findByUser(User user);

    @Query("SELECT t FROM Toilet t WHERE t.roadAddress LIKE %:keyword%")
    List<Toilet> findTop10ByRoadAddressContaining(String keyword);

    boolean existsByManagementNo(String managementNo);

    Optional<Toilet> findByManagementNo(String managementNo);

    @Query("""
    SELECT t
    FROM Toilet t
    WHERE t.isUserSubmitted = false
      AND t.name = :name
      AND t.roadAddress = :roadAddress
      AND t.lat BETWEEN :minLat AND :maxLat
      AND t.lng BETWEEN :minLng AND :maxLng
    ORDER BY t.id ASC
    """)
    List<Toilet> findPublicToiletsByLocation(
            @Param("name") String name,
            @Param("roadAddress") String roadAddress,
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLng") Double minLng,
            @Param("maxLng") Double maxLng,
            Pageable pageable);

    List<Toilet> findByStatus(ToiletStatus status);


}
