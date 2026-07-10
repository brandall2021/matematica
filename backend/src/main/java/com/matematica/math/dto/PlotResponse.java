package com.matematica.math.dto;

public record PlotResponse(
    double[] xValues,
    double[] yValues,
    String expression,
    String latexExpression
) {}
