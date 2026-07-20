package com.matematica.chat.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatResponse(
    UUID messageId,
    UUID sessionId,
    String answer,
    String sources,
    String webSources,
    LocalDateTime timestamp
) {}
