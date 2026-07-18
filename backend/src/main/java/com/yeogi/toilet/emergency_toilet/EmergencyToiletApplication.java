package com.yeogi.toilet.emergency_toilet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@EnableCaching
@SpringBootApplication
public class EmergencyToiletApplication {

	public static void main(String[] args) {
		SpringApplication.run(EmergencyToiletApplication.class, args);
	}

}
