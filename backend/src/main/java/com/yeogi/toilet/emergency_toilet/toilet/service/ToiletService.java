package com.yeogi.toilet.emergency_toilet.toilet.service;

import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletCsvRow;
import com.yeogi.toilet.emergency_toilet.toilet.repository.ToiletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ToiletService {

    private final ToiletRepository toiletRepository;

    public void loadFromCsv(String filePath) {
        try (Reader reader = new InputStreamReader(
                new FileInputStream(filePath), "EUC-KR")) { // 공공데이터 인코딩

            CsvToBean<ToiletCsvRow> csvToBean = new CsvToBeanBuilder<ToiletCsvRow>(reader)
                    .withType(ToiletCsvRow.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .withIgnoreEmptyLine(true)
                    .build();

            List<Toilet> toilets = csvToBean.parse().stream()
                    .filter(row -> row.getLat() != null && !row.getLat().isBlank())
                    .filter(row -> toiletRepository.findByManagementNo(row.getManagementNo()).isEmpty())
                    .map(this::toEntity)
                    .collect(Collectors.toList());

            toiletRepository.saveAll(toilets);
            log.info("화장실 데이터 {}건 저장 완료", toilets.size());

        } catch (Exception e) {
            log.error("CSV 로딩 실패: {}", e.getMessage());
        }
    }

    private Toilet toEntity(ToiletCsvRow row) {
        Toilet t = new Toilet();
        t.setManagementNo(row.getManagementNo());
        t.setName(row.getName());
        t.setRoadAddress(row.getRoadAddress());
        t.setLat(parseDouble(row.getLat()));
        t.setLng(parseDouble(row.getLng()));
        t.setOpenTime(row.getOpenTime());
        t.setOpenTimeDetail(row.getOpenTimeDetail());
        t.setManagingOrg(row.getManagingOrg());
        t.setPhoneNumber(row.getPhoneNumber());
        t.setWasteDisposal(row.getWasteDisposal());
        t.setHasDisabledFacility(parseDisabled(
                row.getMaleDisabledToilet(),
                row.getMaleDisabledUrinal(),
                row.getFemaleDisabledToilet()
        ));
        t.setHasEmergencyBell(parseYn(row.getEmergencyBell()));
        t.setHasDiaperTable(parseYn(row.getDiaperTable()));
        t.setHasEntranceCctv(parseYn(row.getEntranceCctv()));
        return t;
    }

    private Boolean parseYn(String value) {
        if (value == null) return false;
        String v = value.trim();
        return v.equalsIgnoreCase("Y") || v.equals("있음") || v.equals("1");
    }

    private Boolean parseDisabled(String... values) {
        for (String v : values) {
            try {
                if (v != null && Integer.parseInt(v.trim()) > 0) return true;
            } catch (NumberFormatException ignored) {}
        }
        return false;
    }

    private Double parseDouble(String value) {
        try {
            return Double.parseDouble(value.trim());
        } catch (Exception e) {
            return null;
        }
    }
}
