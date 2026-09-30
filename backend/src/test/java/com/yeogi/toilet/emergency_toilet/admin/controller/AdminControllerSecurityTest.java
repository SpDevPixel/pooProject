package com.yeogi.toilet.emergency_toilet.admin.controller;

import com.yeogi.toilet.emergency_toilet.admin.service.AdminService;
import com.yeogi.toilet.emergency_toilet.config.SecurityConfig;
import com.yeogi.toilet.emergency_toilet.toilet.service.ToiletService;
import com.yeogi.toilet.emergency_toilet.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@Import(SecurityConfig.class)
class AdminControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminService adminService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private ToiletService toiletService;

    @MockitoBean
    private CacheManager cacheManager;

    @Test
    void adminCanAccessAdminEndpoint() throws Exception {
        when(toiletService.getAllToiletsForAdmin()).thenReturn(java.util.List.of());

        mockMvc.perform(get("/api/admin").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void nonAdminCannotAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/admin").with(user("member").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanUseAdminServiceEndpointWithoutServiceRoleLookup() throws Exception {
        when(adminService.getAllUsers()).thenReturn(java.util.List.of());

        mockMvc.perform(get("/api/admin/user").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void nonAdminCannotUseAdminServiceEndpoint() throws Exception {
        mockMvc.perform(get("/api/admin/user").with(user("member").roles("USER")))
                .andExpect(status().isForbidden());
    }
}
