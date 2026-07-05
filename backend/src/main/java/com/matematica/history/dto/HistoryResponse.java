package com.matematica.history.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record HistoryResponse(
    UUID id,
    UUID sessionId,
    String sessionTitle,
    String role,
    String content,
    String sources,
    LocalDateTime createdAt
) {}
