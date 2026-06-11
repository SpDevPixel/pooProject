package com.yeogi.toilet.emergency_toilet.toilet.domain;

import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletUpdateDto;
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
    private Long id;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ToiletStatus status = ToiletStatus.PENDING;

    public void updateRatingWhenReviewAdded(double newRating) {
        double totalRating = this.rating * this.reviewCount;

        totalRating += newRating;
        this.reviewCount++;
        
        double newAverage = totalRating / this.reviewCount;
        this.rating = Math.round(newAverage * 10.0) / 10.0;
    }

    public void updateRatingWhenReviewDeleted(double deletedRating) {
        if (this.reviewCount <= 0) {
            this.reviewCount = 0;
            this.rating = 0.0;
            return;
        }

        // 2. 기존 총점 계산 후 삭제된 평점 차감
        double totalRating = this.rating * this.reviewCount;
        totalRating -= deletedRating;
        this.reviewCount--;

        if (this.reviewCount == 0) {
            this.rating = 0.0;
        } else {
            double newAverage = totalRating / this.reviewCount;
            this.rating = Math.round(newAverage * 10.0) / 10.0;
        }
    }

    public void updateAndReapply(ToiletUpdateDto dto) {
        this.openTime = dto.getOpenTime();
        this.openTimeDetail = dto.getOpenTimeDetail();
        this.managingOrg = dto.getManagingOrg();
        this.phoneNumber = dto.getPhoneNumber();
        this.wasteDisposal = dto.getWasteDisposal();

        this.hasEmergencyBell = dto.getEmergencyBell();
        this.hasDiaperTable = dto.getDiaperTable();
        this.hasEntranceCctv = dto.getEntranceCctv();
        this.hasDisabledFacility = dto.getDisabledFacility();

        this.status = ToiletStatus.PENDING;
    }
}
