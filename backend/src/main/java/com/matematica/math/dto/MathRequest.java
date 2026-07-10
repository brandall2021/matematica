package com.matematica.math.dto;

import jakarta.validation.constraints.NotBlank;

public record MathRequest(
    @NotBlank String operation,
    @NotBlank String expression,
    String variable,
    String point,
    Double xMin,
    Double xMax
) {}
