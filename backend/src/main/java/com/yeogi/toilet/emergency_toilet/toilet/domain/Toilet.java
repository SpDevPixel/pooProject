package com.yeogi.toilet.emergency_toilet.toilet.domain;

import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletUpdateDto;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

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

    @Column(nullable = false, columnDefinition = "double default 0")
    private double ratingSum;

    public void updateRatingWhenReviewAdded(double newRating) {
        this.ratingSum += newRating;
        this.reviewCount++;
        refreshAverage();
    }

    public void updateRatingWhenReviewDeleted(double deletedRating) {
        if (this.reviewCount <= 0) {
            resetRating();
            return;
        }
        this.ratingSum -= deletedRating;
        this.reviewCount--;
        refreshAverage();
    }

    private void refreshAverage() {
        if (this.reviewCount == 0) {
            resetRating();
            return;
        }
        this.rating = Math.round(this.ratingSum / this.reviewCount * 10.0) / 10.0;
    }

    private void resetRating() {
        this.reviewCount = 0;
        this.ratingSum = 0.0;
        this.rating = 0.0;
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
