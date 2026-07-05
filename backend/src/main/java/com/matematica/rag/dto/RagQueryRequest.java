package com.matematica.rag.dto;

import jakarta.validation.constraints.NotBlank;

public record RagQueryRequest(@NotBlank String query) {}
