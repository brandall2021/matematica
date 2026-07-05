package com.matematica.settings.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record SettingResponse(UUID id, String key, String value, String description, LocalDateTime updatedAt) {}
