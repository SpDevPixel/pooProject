package com.yeogi.toilet.emergency_toilet.toilet.service;

import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletCsvRow;
import com.yeogi.toilet.emergency_toilet.toilet.repository.ToiletRepository;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ToiletService {

    private final ToiletRepository toiletRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    // 공공 데이터만 조회
    public List<Toilet> getPublicToilets() {
        return toiletRepository.findByIsUserSubmitted(false);
    }

    // 이용자 등록 데이터만 조회
    public List<Toilet> getUserToilets() {
        return toiletRepository.findByIsUserSubmitted(true);
    }

    // 전체 조회
    public List<Toilet> getAllToilets() {
        return toiletRepository.findAll();
    }

    // 이용자 화장실 등록
    public Toilet addUserToilet(Toilet toilet, String token) {
        String pureToken = token.substring(7);
        String id = jwtUtil.extractId(pureToken);
//        toilet.setUser(id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));
        toilet.setUser(user);
        toilet.setIsUserSubmitted(true);
        return toiletRepository.save(toilet);
    }

    //이용자가 등록한 화장실 조회
    public List<Toilet> getUserToilets(String token){
        String pureToken = token.substring(7);
        String id = jwtUtil.extractId(pureToken);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        return toiletRepository.findByUser(user);
    }

    //화장실 정보 삭제
    @Transactional
    public void deleteAToilet(String managementNo,String id){
        Toilet toilet = toiletRepository.findById(managementNo).orElseThrow(() -> new RuntimeException("화장실을 찾을 수 없습니다"));
        if(!toilet.getUser().getId().equals(id)){
            throw new AccessDeniedException("본인이 등록한 데이터만 삭제할 수 있습니다.");
        }
        toiletRepository.delete(toilet);
    }

    public boolean hasData() {
        return toiletRepository.count() > 0;
    }

    // CSV에서 공공데이터 로드
    public void loadFromCsv(String filePath) {
        try (Reader reader = new InputStreamReader(
                new FileInputStream(filePath), "EUC-KR")) {

            CsvToBean<ToiletCsvRow> csvToBean = new CsvToBeanBuilder<ToiletCsvRow>(reader)
                    .withType(ToiletCsvRow.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .withIgnoreEmptyLine(true)
                    .build();

            List<Toilet> toilets = csvToBean.parse().stream()
                    .filter(row -> row.getLat() != null && !row.getLat().isBlank())
                    .map(this::toEntity)
                    .collect(Collectors.toList());

            toiletRepository.saveAll(toilets);  // 🔥 Firebase set() → saveAll()
            log.info("화장실 데이터 {}건 MySQL 저장 완료", toilets.size());

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
        t.setIsUserSubmitted(false);  // CSV는 공공데이터
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