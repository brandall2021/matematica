package com.matematica.auth;

import com.matematica.auth.controller.AuthController;
import com.matematica.auth.dto.AuthResponse;
import com.matematica.auth.exception.DuplicateEmailException;
import com.matematica.auth.service.AuthService;
import com.matematica.config.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(GlobalExceptionHandler.class)
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    private AuthResponse dummyAuthResponse() {
        return new AuthResponse(
                "jwt-token-value",
                "refresh-token-value",
                UUID.randomUUID().toString(),
                "user@example.com",
                "Test User",
                "STUDENT"
        );
    }

    // ── Registration ──────────────────────────────────────────────

    @Test
    void shouldRegisterUser() throws Exception {
        when(authService.register(any())).thenReturn(dummyAuthResponse());

        String body = """
            {
                "email": "newuser@example.com",
                "password": "Password123!",
                "name": "Test User"
            }
            """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.userId").isString());
    }

    @Test
    void shouldReturn409OnDuplicateEmail() throws Exception {
        when(authService.register(any()))
                .thenThrow(new DuplicateEmailException("dup@example.com"));

        String body = """
            {
                "email": "dup@example.com",
                "password": "Password123!",
                "name": "Dup User"
            }
            """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Conflict"));
    }

    @Test
    void shouldReturn400WhenPasswordIsNull() throws Exception {
        String body = """
            {
                "email": "valid@example.com",
                "password": null,
                "name": "Test User"
            }
            """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Error"));
    }

    @Test
    void shouldReturn400WhenPasswordTooShort() throws Exception {
        String body = """
            {
                "email": "valid@example.com",
                "password": "ab",
                "name": "Test User"
            }
            """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Error"));
    }

    @Test
    void shouldReturn400OnSqlInjectionInEmail() throws Exception {
        String body = """
            {
                "email": "'; DROP TABLE users; --",
                "password": "Password123!",
                "name": "Hacker"
            }
            """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Error"));
    }

    // ── Login ─────────────────────────────────────────────────────

    @Test
    void shouldLoginAndReturnJwt() throws Exception {
        when(authService.login(any())).thenReturn(dummyAuthResponse());

        String body = """
            {
                "email": "user@example.com",
                "password": "Password123!"
            }
            """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-value"))
                .andExpect(jsonPath("$.userId").isString());
    }

    @Test
    void shouldReturn401OnWrongPassword() throws Exception {
        when(authService.login(any()))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        String body = """
            {
                "email": "user@example.com",
                "password": "WrongPass1!"
            }
            """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Unauthorized"));
    }
}
