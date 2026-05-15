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

        // 데이터가 하나도 없는 경우에만 API 호출
        if (!toiletService.hasData()) {
            log.info("DB가 비어있습니다. 서울시 공공데이터를 로드합니다.");
            toiletService.loadFromApi();
        } else {
            log.info("기존 데이터가 존재하여 API 자동 로드를 건너뜁니다.");
        }
    }
}