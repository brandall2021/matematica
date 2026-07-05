package com.matematica.documents.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DocumentResponse(
    UUID id,
    String filename,
    String type,
    String mimeType,
    long size,
    String author,
    String title,
    String subject,
    String unit,
    String topic,
    String source,
    String sourceUrl,
    Integer pageCount,
    String tags,
    int chunkCount,
    boolean indexed,
    String errorMessage,
    LocalDateTime createdAt
) {}
