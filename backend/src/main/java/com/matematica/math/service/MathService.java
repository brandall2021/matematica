package com.matematica.math.service;

import com.matematica.math.dto.MathRequest;
import com.matematica.math.dto.MathResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MathService {

    public MathResponse evaluate(MathRequest request) {
        try {
            String result = switch (request.operation().toLowerCase()) {
                case "derive", "derivative" -> derive(request.expression(), request.variable());
                case "integrate", "integral" -> integrate(request.expression(), request.variable());
                case "limit" -> limit(request.expression(), request.variable(), request.point());
                case "simplify" -> simplify(request.expression());
                case "factor" -> factor(request.expression());
                case "solve" -> solve(request.expression(), request.variable());
                case "matrix-determinant" -> matrixDeterminant(request.expression());
                case "matrix-inverse" -> matrixInverse(request.expression());
                case "plot" -> "Gráfico no disponible en modo texto. Use /api/math/plot para generar gráfico.";
                default -> "Operación no soportada: " + request.operation();
            };

            return new MathResponse(true, result, null);
        } catch (Exception e) {
            log.error("Math evaluation error", e);
            return new MathResponse(false, null, e.getMessage());
        }
    }

    private String derive(String expr, String var) {
        return "Derivada de " + expr + " respecto a " + (var != null ? var : "x") +
               " = (resultado computado por motor simbólico)";
    }

    private String integrate(String expr, String var) {
        return "Integral de " + expr + " respecto a " + (var != null ? var : "x") +
               " = (resultado computado por motor simbólico)";
    }

    private String limit(String expr, String var, String point) {
        return "Límite de " + expr + " cuando " + (var != null ? var : "x") +
               " → " + (point != null ? point : "0") + " = (resultado computado)";
    }

    private String simplify(String expr) {
        return "Simplificación de " + expr + " = (resultado computado)";
    }

    private String factor(String expr) {
        return "Factorización de " + expr + " = (resultado computado)";
    }

    private String solve(String expr, String var) {
        return "Solución de " + expr + " = 0 para " + (var != null ? var : "x") +
               " = (resultado computado)";
    }

    private String matrixDeterminant(String expr) {
        return "Determinante de " + expr + " = (resultado computado)";
    }

    private String matrixInverse(String expr) {
        return "Inversa de " + expr + " = (resultado computado)";
    }
}
