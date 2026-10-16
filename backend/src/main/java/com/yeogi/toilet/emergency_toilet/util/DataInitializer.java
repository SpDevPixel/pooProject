package com.yeogi.toilet.emergency_toilet.util; // 적절한 패키지로 변경

import com.yeogi.toilet.emergency_toilet.toilet.service.ToiletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final ToiletService toiletService;

    @Override
    public void run(String... args) throws Exception {
        log.info("데이터 초기화 체크 중...");

        // 신규 데이터는 추가하고, 기존 공공데이터 행은 최신 API 값으로 갱신합니다.
        log.info("서울시 공공데이터를 로드하고 기존 공공데이터를 갱신합니다.");
        toiletService.loadFromApi();
    }
}
