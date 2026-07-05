package com.matematica.documents.dto;

import jakarta.validation.constraints.NotBlank;

public record YouTubeRequest(
    @NotBlank String url,
    String subject,
    String unit,
    String topic,
    String tags
) {}
