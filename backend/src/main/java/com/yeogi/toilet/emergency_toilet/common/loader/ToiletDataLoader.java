package com.yeogi.toilet.emergency_toilet.common.loader;

import com.yeogi.toilet.emergency_toilet.toilet.service.ToiletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ToiletDataLoader implements CommandLineRunner {

    private final ToiletService toiletService;

    @Value("${toilet.csv.path}")
    private String csvPath;

    @Override
    public void run(String... args) {
        log.info("화장실 CSV 데이터 로딩 시작...");
        toiletService.loadFromCsv(csvPath);
    }
}