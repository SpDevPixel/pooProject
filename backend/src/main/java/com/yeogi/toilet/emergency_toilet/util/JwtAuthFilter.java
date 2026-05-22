package com.yeogi.toilet.emergency_toilet.util;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

// 💡 SecurityConfig.java 29라인의 'new JwtAuthFilter(jwtUtil)' 호출을 받아낼 수 있게 됩니다.
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 일단은 아무 로직 없이 통과만 시키도록 설정
        filterChain.doFilter(request, response);
    }
}