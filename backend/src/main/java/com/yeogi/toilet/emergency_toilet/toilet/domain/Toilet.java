package com.yeogi.toilet.emergency_toilet.toilet.domain;

import com.yeogi.toilet.emergency_toilet.user.domain.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "toilets")
@Getter
@Setter
@NoArgsConstructor
public class Toilet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 👈 이것을 실제 PK로 사용 (자동생성)

    @Column(name = "management_no")
    private String managementNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    private String name;
    private String roadAddress;
    @Column(nullable = true)
    private Double lat;
    @Column(nullable = true)
    private Double lng;
    private String openTime;
    private String openTimeDetail;
    private String managingOrg;
    private String phoneNumber;
    private String wasteDisposal;
    private Boolean hasDisabledFacility;
    private Boolean hasEmergencyBell;
    private Boolean hasDiaperTable;
    private Boolean hasEntranceCctv;

    // 공공 데이터 vs 이용자 등록 구분
    @Column(nullable = false)
    private Boolean isUserSubmitted = false;

    @Column(nullable = false)
    private int reviewCount = 0;

    @Column(nullable = false)
    private double rating = 0.0;

    public void updateRatingWhenReviewAdded(double newRating) {
        double totalRating = this.rating * this.reviewCount;

        totalRating += newRating;
        this.reviewCount++;
        
        double newAverage = totalRating / this.reviewCount;
        this.rating = Math.round(newAverage * 10.0) / 10.0;
    }
}
