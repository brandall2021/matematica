package com.matematica.chat.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record ChatRequest(
    UUID sessionId,
    @NotBlank String message,
    boolean webSearchEnabled
) {}
