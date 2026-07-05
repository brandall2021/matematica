package com.matematica.auth.dto;

public record AuthResponse(
    String token,
    String refreshToken,
    String userId,
    String email,
    String name,
    String role
) {}
