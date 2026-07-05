package com.matematica.chat.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatSessionResponse(
    UUID id,
    String title,
    int messageCount,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
