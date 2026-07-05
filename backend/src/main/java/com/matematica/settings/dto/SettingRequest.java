package com.matematica.settings.dto;

import jakarta.validation.constraints.NotBlank;

public record SettingRequest(
    @NotBlank String key,
    @NotBlank String value,
    String description
) {}
