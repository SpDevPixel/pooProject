package com.yeogi.toilet.emergency_toilet.toilet.service;

import com.yeogi.toilet.emergency_toilet.review.domain.Review;
import com.yeogi.toilet.emergency_toilet.review.repository.ReviewRepository;
import com.yeogi.toilet.emergency_toilet.toilet.domain.Toilet;
import com.yeogi.toilet.emergency_toilet.toilet.domain.ToiletStatus;
import com.yeogi.toilet.emergency_toilet.toilet.dto.SeoulToiletApiResponse;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletApiRow;
import com.yeogi.toilet.emergency_toilet.toilet.dto.ToiletUpdateDto;
import com.yeogi.toilet.emergency_toilet.toilet.repository.ToiletRepository;
import com.yeogi.toilet.emergency_toilet.toilet.repository.ToiletRequestRepository;
import com.yeogi.toilet.emergency_toilet.user.domain.User;
import com.yeogi.toilet.emergency_toilet.user.repository.UserFavoriteRepository;
import com.yeogi.toilet.emergency_toilet.user.repository.UserRepository;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
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
    private final ReviewRepository reviewRepository;
    private final UserFavoriteRepository favoriteRepository;
    private final ToiletRequestRepository toiletRequestRepository;
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
        return toiletRepository.findByIsUserSubmittedAndStatus(false, ToiletStatus.APPROVED);
    }

    public List<Toilet> getUserToilets() {
        return toiletRepository.findByIsUserSubmittedAndStatus(true, ToiletStatus.APPROVED);
    }

    public List<Toilet> getAllToilets() {
        return toiletRepository.findByStatus(ToiletStatus.APPROVED);
    }

    public List<Toilet> searchAddressToilet(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return toiletRepository.findTop10ByRoadAddressContaining(keyword.trim());
    }

    //승인 대기 중(PENDING)인 화장실 목록 조회
    @Transactional(readOnly = true)
    public List<Toilet> getPendingToilets() {
        // 리포지토리를 통해 상태가 PENDING인 데이터만 뽑아서 컨트롤러로 반환합니다.
        return toiletRepository.findByStatus(ToiletStatus.PENDING);
    }

    @Transactional
    public void updateAndReapplyToilet(Long userId, Long toiletId, ToiletUpdateDto dto) {
        // 1. 수정할 화장실 존재 여부 확인
        Toilet toilet = toiletRepository.findById(toiletId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 화장실입니다."));


        if (!toilet.getId().equals(userId)) {
            throw new SecurityException("본인이 등록한 화장실만 수정 및 재요청할 수 있습니다.");
        }


        if (toilet.getStatus() != ToiletStatus.REJECTED) {
            throw new IllegalStateException("반려된 상태의 화장실만 재요청할 수 있습니다.");
        }
        toilet.updateAndReapply(dto);
    }

    //관리자 화장실 삭제
    @Transactional
    public void deleteAdminToilet(Long id) {
        Toilet toilet = toiletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 화장실입니다."));

        reviewRepository.deleteByToilet(toilet);
        toiletRequestRepository.deleteByToilet(toilet);

        favoriteRepository.deleteByToilet(toilet);

        toiletRepository.delete(toilet);
    }

    //관리자 화장실 수정
    @Transactional
    public void updateAdminToilet(Long id, ToiletUpdateDto dto) {
        Toilet toilet = toiletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 화장실입니다."));

        // 넘겨받은 수정 데이터 스냅샷 매핑
        if (dto.getName() != null) toilet.setName(dto.getName());
        if (dto.getRoadAddress() != null) toilet.setRoadAddress(dto.getRoadAddress());
        if (dto.getPhoneNumber() != null) toilet.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getOpenTime() != null) toilet.setOpenTime(dto.getOpenTime());
        if (dto.getManagingOrg() != null) toilet.setManagingOrg(dto.getManagingOrg());

        if (dto.getStatus() != null) toilet.setStatus(dto.getStatus());

    }
    //관리자 화장실 조회
    @Transactional(readOnly = true) // 조회 최적화
    public List<Toilet> getAllToiletsForAdmin() {
        return toiletRepository.findAll();
    }

    /**
     * 2. 이용자 등록 및 관리 메서드들
     */
    public Toilet addUserToilet(Toilet toilet, String token) {
        String pureToken = token.substring(7);
        Long id = jwtUtil.extractId(pureToken);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        toilet.setUser(user);
        toilet.setIsUserSubmitted(true);

        toilet.setStatus(ToiletStatus.PENDING);

        return toiletRepository.save(toilet);
    }

    public List<Toilet> getUserToilets(String token){
        String pureToken = token.substring(7);
        Long id = jwtUtil.extractId(pureToken);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다"));

        return toiletRepository.findByUser(user);
    }

    @Transactional
    public void deleteAToilet(Long toiletId, Long id){ // 1. 타입을 String에서 Long으로 변경
        Toilet toilet = toiletRepository.findById(toiletId)
                .orElseThrow(() -> new RuntimeException("화장실을 찾을 수 없습니다"));

        // 2. 이제 Long 대 Long의 올바른 비교가 이루어집니다.
        if(!toilet.getUser().getId().equals(id)){
            throw new AccessDeniedException("본인이 등록한 데이터만 삭제할 수 있습니다.");
        }

        reviewRepository.deleteByToiletId(toiletId);         // 연관된 리뷰 삭제
        favoriteRepository.deleteByToiletId(toiletId);       // 연관된 즐겨찾기 삭제
        toiletRequestRepository.deleteByToiletId(toiletId);

        toiletRepository.delete(toilet);
    }

    @Transactional
    public void updateToiletInfo(Long toiletId, Long id, ToiletUpdateDto dto) {
        Toilet toilet = toiletRepository.findById(toiletId)
                .orElseThrow(() -> new EntityNotFoundException("화장실을 찾을 수 없습니다."));

        if (!toilet.getUser().getId().equals(id)) {
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

        if (dto.getDisabledFacility() != null) {
            toilet.setHasDisabledFacility(dto.getDisabledFacility());
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
            String initialUrl = String.format("%s/%s/json/mgisToiletPoi/1/1", baseUrl, apiKey);
            ResponseEntity<SeoulToiletApiResponse> initialResponse = restTemplate.getForEntity(initialUrl, SeoulToiletApiResponse.class);

            if (initialResponse.getBody() != null && initialResponse.getBody().getServiceResult() != null) {
                totalCount = initialResponse.getBody().getServiceResult().getListTotalCount();
            }

            log.info("서울시 API 총 데이터 개수: {}건", totalCount);

            for (int i = startIndex; i <= totalCount; i += step) {
                int end = Math.min(i + step - 1, totalCount);
                String url = String.format("%s/%s/json/mgisToiletPoi/%d/%d", baseUrl, apiKey, i, end);
                ResponseEntity<SeoulToiletApiResponse> response = restTemplate.getForEntity(url, SeoulToiletApiResponse.class);

                if (response.getBody() != null && response.getBody().getServiceResult() != null) {
                    List<ToiletApiRow> rows = response.getBody().getServiceResult().getRow();

                    if (rows != null && !rows.isEmpty()) {
                        List<Toilet> toiletsToSave = rows.stream()
                                // 1. 수정: existsByManagementNo를 사용하여 기존 DB에 있는지 검사
                                .filter(row -> !toiletRepository.existsByManagementNo(row.getManagementNo()))
                                // 2. 중요: toEntityFromApi 내부에서는 새 PK(id)를 세팅하지 않아야 함
                                .map(this::toEntityFromApi)
                                .collect(Collectors.toList());

                        if (!toiletsToSave.isEmpty()) {
                            toiletRepository.saveAll(toiletsToSave);
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

        t.setStatus(ToiletStatus.APPROVED);

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