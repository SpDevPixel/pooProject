package com.yeogi.toilet.emergency_toilet.toilet.dto;

import com.yeogi.toilet.emergency_toilet.toilet.domain.ToiletStatus;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ToiletUpdateDto {
    private String name;           // 화장실 이름
    private String roadAddress;    // 도로명 주소

    private String openTime;
    private String openTimeDetail;
    private String managingOrg;
    private String phoneNumber;
    private String wasteDisposal;

    // String("Y"/"N") 대신 처음부터 Boolean으로 받기
    private Boolean emergencyBell;
    private Boolean diaperTable;
    private Boolean entranceCctv;

    private Boolean disabledFacility;

    @Enumerated(EnumType.STRING)
    private ToiletStatus status;

    public void updateAndReapply(ToiletUpdateDto dto) {
        this.openTime = dto.getOpenTime();
        this.openTimeDetail = dto.getOpenTimeDetail();
        this.managingOrg = dto.getManagingOrg();
        this.phoneNumber = dto.getPhoneNumber();
        this.wasteDisposal = dto.getWasteDisposal();
        this.emergencyBell = dto.getEmergencyBell();
        this.diaperTable = dto.getDiaperTable();
        this.entranceCctv = dto.getEntranceCctv();
        this.disabledFacility = dto.getDisabledFacility();

        this.status = ToiletStatus.PENDING;
    }
}