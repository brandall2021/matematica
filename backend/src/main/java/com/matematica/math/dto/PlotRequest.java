package com.matematica.math.dto;

import jakarta.validation.constraints.NotBlank;

public record PlotRequest(
    @NotBlank String expression,
    String variable,
    double xMin,
    double xMax,
    double yMin,
    double yMax
) {}
