package com.matematica.math.dto;

import jakarta.validation.constraints.NotBlank;

public record PlotRequest(
    @NotBlank String expression,
    String variable,
    Double xMin,
    Double xMax,
    Double yMin,
    Double yMax
) {}
