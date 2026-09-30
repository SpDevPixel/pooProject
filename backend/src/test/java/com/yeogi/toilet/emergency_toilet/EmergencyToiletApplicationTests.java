package com.yeogi.toilet.emergency_toilet;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = {
		"JWTUTIL_PASSWORD=test-only-signing-key-with-at-least-32-bytes",
		"SEOUL_TOILET_API_KEY=test-only-api-key"
})
@ActiveProfiles("test")
class EmergencyToiletApplicationTests {

	@Test
	void contextLoads() {
	}

}
