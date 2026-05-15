package com.yeogi.toilet.emergency_toilet.toilet.service;

import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.dto.SeoulToiletApiResponse;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletApiRow;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletUpdateDto;
import com.yeogi.toilet.emergency_toilet.toilet.repository.ToiletRepository;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ToiletService {

    private final ToiletRepository toiletRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final RestTemplate restTemplate;

    @Value("${seoul.api.key}")
    private String apiKey;

    @Value("${seoul.api.base-url}")
    private String baseUrl;

    /**
     * 1. 화장실 조회 관련 메서드들
     */
    public List<Toilet> getPublicToilets() {
        return toiletRepository.findByIsUserSubmitted(false);
    }

    public List<Toilet> getUserToilets() {
        return toiletRepository.findByIsUserSubmitted(true);
    }

    public List<Toilet> getAllToilets() {
        return toiletRepository.findAll();
    }

    public List<Toilet> searchAddressToilet(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return toiletRepository.findByAddressContaining(keyword.trim());
    }

    /**
     * 2. 이용자 등록 및 관리 메서드들
     */
    public Toilet addUserToilet(Toilet toilet, String token) {
        String pureToken = token.substring(7);
        String id = jwtUtil.extractId(pureToken);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        toilet.setUser(user);
        toilet.setIsUserSubmitted(true);
        return toiletRepository.save(toilet);
    }

    public List<Toilet> getUserToilets(String token){
        String pureToken = token.substring(7);
        String id = jwtUtil.extractId(pureToken);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        return toiletRepository.findByUser(user);
    }

    @Transactional
    public void deleteAToilet(String managementNo, String id){
        Toilet toilet = toiletRepository.findById(managementNo)
                .orElseThrow(() -> new RuntimeException("화장실을 찾을 수 없습니다"));

        if(!toilet.getUser().getId().equals(id)){
            throw new AccessDeniedException("본인이 등록한 데이터만 삭제할 수 있습니다.");
        }
        toiletRepository.delete(toilet);
    }

    @Transactional
    public void updateToiletInfo(String managementNo, String userId, ToiletUpdateDto dto) {
        Toilet toilet = toiletRepository.findById(managementNo)
                .orElseThrow(() -> new EntityNotFoundException("화장실을 찾을 수 없습니다."));

        if (!toilet.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("수정 권한이 없습니다.");
        }

        if (dto.getOpenTime() != null) toilet.setOpenTime(dto.getOpenTime());
        if (dto.getOpenTimeDetail() != null) toilet.setOpenTimeDetail(dto.getOpenTimeDetail());
        if (dto.getManagingOrg() != null) toilet.setManagingOrg(dto.getManagingOrg());
        if (dto.getPhoneNumber() != null) toilet.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getWasteDisposal() != null) toilet.setWasteDisposal(dto.getWasteDisposal());

        // DTO가 String("Y"/"N")을 유지할 경우를 위한 처리
        if (dto.getEmergencyBell() != null) {
            toilet.setHasEmergencyBell(dto.getEmergencyBell());
        }

        if (dto.getDiaperTable() != null) {
            toilet.setHasDiaperTable(dto.getDiaperTable());
        }

        if (dto.getEntranceCctv() != null) {
            toilet.setHasEntranceCctv(dto.getEntranceCctv());
        }
    }

    /**
     * 3. 서울시 API 연동 데이터 로드 로직
     */
    @Transactional
    public void loadFromApi() {
        int startIndex = 1;
        int step = 1000;
        int totalCount = 0;

        try {
            // 1. 전체 데이터 개수 파악 (mgisToiletPoi 사용)
            String initialUrl = String.format("%s/%s/json/mgisToiletPoi/1/1", baseUrl, apiKey);
            ResponseEntity<SeoulToiletApiResponse> initialResponse = restTemplate.getForEntity(initialUrl, SeoulToiletApiResponse.class);

            if (initialResponse.getBody() != null && initialResponse.getBody().getServiceResult() != null) {
                totalCount = initialResponse.getBody().getServiceResult().getListTotalCount();
            }

            log.info("서울시 API 총 데이터 개수: {}건", totalCount);

            // 2. 전체 개수만큼 반복하여 페이징 처리
            for (int i = startIndex; i <= totalCount; i += step) {
                int end = Math.min(i + step - 1, totalCount);

                // 중요: 여기도 mgisToiletPoi로 수정해야 합니다!
                String url = String.format("%s/%s/json/mgisToiletPoi/%d/%d", baseUrl, apiKey, i, end);

                ResponseEntity<SeoulToiletApiResponse> response = restTemplate.getForEntity(url, SeoulToiletApiResponse.class);

                if (response.getBody() != null && response.getBody().getServiceResult() != null) {
                    List<ToiletApiRow> rows = response.getBody().getServiceResult().getRow();

                    if (rows != null && !rows.isEmpty()) {
                        List<Toilet> toiletsToSave = rows.stream()
                                .filter(row -> !toiletRepository.existsById(row.getManagementNo()))
                                .map(this::toEntityFromApi)
                                .collect(Collectors.toList());

                        if (!toiletsToSave.isEmpty()) {
                            toiletRepository.saveAll(toiletsToSave);
                            // 변경 내용을 즉시 DB에 반영하기 위해 flush 호출 권장
                            toiletRepository.flush();
                        }
                    }
                }
                log.info("API 데이터 로딩 및 저장 중: {} ~ {} 건 완료", i, end);
            }
            log.info("모든 공공 데이터 DB 저장 완료.");

        } catch (Exception e) {
            log.error("서울시 화장실 API 로딩 실패: {}", e.getMessage(), e);
        }
    }

    private Toilet toEntityFromApi(ToiletApiRow row) {
        Toilet t = new Toilet();

        // 1. 기본 정보 매핑 (API 출력명 기준)
        t.setManagementNo(row.getManagementNo());    // OBJECTID
        t.setName(row.getName());                    // CONTS_NAME
        t.setRoadAddress(row.getRoadAddress());      // ADDR_NEW
        t.setLat(parseDouble(row.getLat()));         // COORD_Y
        t.setLng(parseDouble(row.getLng()));         // COORD_X
        t.setPhoneNumber(row.getPhoneNumber());      // TEL_NO
        t.setOpenTime(row.getOpenTime());            // VALUE_02
        t.setManagingOrg(row.getManagingOrg());      // VALUE_08

        // 2. 텍스트 정보 파싱 (Boolean 변환)
        // 장애인 화장실 (VALUE_05)
        boolean hasDisabled = row.getDisabledFacilityStatus() != null
                && !row.getDisabledFacilityStatus().trim().isEmpty()
                && !row.getDisabledFacilityStatus().contains("없음");
        t.setHasDisabledFacility(hasDisabled);

        // 편의시설 (VALUE_06): "비상벨", "기저귀" 키워드 포함 여부 확인
        String convenience = row.getConvenienceFacilities();
        if (convenience != null) {
            t.setHasEmergencyBell(convenience.contains("비상벨"));
            t.setHasDiaperTable(convenience.contains("기저귀"));
        } else {
            t.setHasEmergencyBell(false);
            t.setHasDiaperTable(false);
        }

        t.setHasEntranceCctv(false); // API에서 제공 여부 확인 후 수정 가능
        t.setIsUserSubmitted(false); // 공공데이터

        return t;
    }


    private Double parseDouble(String value) {
        try {
            if (value == null) return null;
            return Double.parseDouble(value.trim());
        } catch (Exception e) {
            return null;
        }
    }

    public boolean hasData() {
        return toiletRepository.count() > 0;
    }
}