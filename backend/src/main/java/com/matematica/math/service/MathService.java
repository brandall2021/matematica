package com.matematica.math.service;

import com.matematica.math.dto.MathRequest;
import com.matematica.math.dto.MathResponse;
import com.matematica.math.dto.PlotResponse;
import lombok.extern.slf4j.Slf4j;
import org.matheclipse.core.eval.ExprEvaluator;
import org.matheclipse.core.interfaces.IExpr;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MathService {

    private final ExprEvaluator evaluator = new ExprEvaluator(false, 10);

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
                case "plot" -> plotData(request.expression(), request.variable());
                case "evaluate" -> eval(request.expression());
                case "summation", "sum" -> summation(request.expression(), request.variable(), request.point());
                case "product", "prod" -> product(request.expression(), request.variable(), request.point());
                case "taylor", "series" -> taylorSeries(request.expression(), request.variable(), request.point());
                case "expand" -> expand(request.expression());
                case "dsolve" -> dsolve(request.expression(), request.variable());
                case "gcd" -> gcd(request.expression(), request.variable());
                case "lcm" -> lcm(request.expression(), request.variable());
                case "nsum", "numerical-sum" -> numericalSum(request.expression(), request.variable(), request.point());
                case "roots" -> roots(request.expression(), request.variable());
                case "matrix-rank" -> matrixRank(request.expression());
                case "matrix-echelon" -> matrixEchelon(request.expression());
                default -> "Operacion no soportada: " + request.operation();
            };

            return new MathResponse(true, result, null);
        } catch (Exception e) {
            log.error("Math evaluation error", e);
            return new MathResponse(false, null, e.getMessage());
        }
    }

    public PlotResponse computePlotData(String expression, String variable, Double xMin, Double xMax, Double yMin, Double yMax) {
        String v = variable != null ? variable : "x";
        double min = xMin != null ? xMin : -10.0;
        double max = xMax != null ? xMax : 10.0;
        int numPoints = 200;
        double step = (max - min) / (numPoints - 1);

        double[] xValues = new double[numPoints];
        double[] yValues = new double[numPoints];

        for (int i = 0; i < numPoints; i++) {
            xValues[i] = min + i * step;
            try {
                IExpr result = evaluator.evaluate(expression.replace(v, "(" + xValues[i] + ")"));
                yValues[i] = result.isSignedNumber() ? ((org.matheclipse.core.interfaces.ISignedNumber) result).doubleValue() : Double.NaN;
            } catch (Exception e) {
                yValues[i] = Double.NaN;
            }
        }

        IExpr latexExpr = evaluator.evaluate("TeXForm(" + expression + ")");
        String latex = latexExpr.toString();

        return new PlotResponse(xValues, yValues, expression, latex);
    }

    private String plotData(String expression, String variable) {
        PlotResponse data = computePlotData(expression, variable, null, null, null, null);
        StringBuilder json = new StringBuilder("{\"x\":");
        json.append("[");
        for (int i = 0; i < data.xValues().length; i++) {
            if (i > 0) json.append(",");
            json.append(data.xValues()[i]);
        }
        json.append("],\"y\":[");
        for (int i = 0; i < data.yValues().length; i++) {
            if (i > 0) json.append(",");
            json.append(data.yValues()[i]);
        }
        json.append("],\"expression\":\"").append(data.expression()).append("\"}");
        return json.toString();
    }

    private String summation(String expr, String var, String range) {
        String v = var != null ? var : "x";
        String bounds = parseRange(range, v);
        IExpr result = evaluator.evaluate("Sum(" + expr + ", " + bounds + ")");
        return result.toString();
    }

    private String product(String expr, String var, String range) {
        String v = var != null ? var : "x";
        String bounds = parseRange(range, v);
        IExpr result = evaluator.evaluate("Product(" + expr + ", " + bounds + ")");
        return result.toString();
    }

    private String taylorSeries(String expr, String var, String params) {
        String v = var != null ? var : "x";
        String[] parts = parseParams(params);
        String point = parts.length > 0 ? parts[0] : "0";
        String order = parts.length > 1 ? parts[1] : "4";
        IExpr result = evaluator.evaluate("Series(" + expr + ", {" + v + ", " + point + ", " + order + "})");
        return result.toString();
    }

    private String expand(String expr) {
        IExpr result = evaluator.evaluate("Expand(" + expr + ")");
        return result.toString();
    }

    private String dsolve(String expr, String var) {
        String v = var != null ? var : "x";
        IExpr result = evaluator.evaluate("DSolve(" + expr + ", f(" + v + "), " + v + ")");
        return result.toString();
    }

    private String gcd(String a, String b) {
        IExpr result = evaluator.evaluate("GCD(" + a + ", " + b + ")");
        return result.toString();
    }

    private String lcm(String a, String b) {
        IExpr result = evaluator.evaluate("LCM(" + a + ", " + b + ")");
        return result.toString();
    }

    private String numericalSum(String expr, String var, String range) {
        String v = var != null ? var : "x";
        String bounds = parseRange(range, v);
        IExpr result = evaluator.evaluate("NSum(" + expr + ", " + bounds + ")");
        return result.toString();
    }

    private String roots(String expr, String var) {
        String v = var != null ? var : "x";
        IExpr result = evaluator.evaluate("NSolve(" + expr + " == 0, " + v + ")");
        return result.toString();
    }

    private String matrixRank(String expr) {
        IExpr result = evaluator.evaluate("MatrixRank(" + expr + ")");
        return result.toString();
    }

    private String matrixEchelon(String expr) {
        IExpr result = evaluator.evaluate("RowReduce(" + expr + ")");
        return result.toString();
    }

    private String parseRange(String range, String var) {
        if (range == null || range.isBlank()) {
            return "{" + var + ", 1, 10}";
        }
        String[] parts = range.split(",");
        if (parts.length >= 2) {
            return "{" + var + ", " + parts[0].trim() + ", " + parts[1].trim() + "}";
        }
        return "{" + var + ", " + range.trim() + ", 10}";
    }

    private String[] parseParams(String params) {
        if (params == null || params.isBlank()) {
            return new String[]{};
        }
        String[] parts = params.split(",");
        String[] result = new String[parts.length];
        for (int i = 0; i < parts.length; i++) {
            result[i] = parts[i].trim();
        }
        return result;
    }

    private String derive(String expr, String var) {
        String v = var != null ? var : "x";
        IExpr result = evaluator.evaluate("D(" + expr + ", " + v + ")");
        return result.toString();
    }

    private String integrate(String expr, String var) {
        String v = var != null ? var : "x";
        IExpr result = evaluator.evaluate("Integrate(" + expr + ", " + v + ")");
        return result.toString();
    }

    private String limit(String expr, String var, String point) {
        String v = var != null ? var : "x";
        String p = point != null ? point : "0";
        IExpr result = evaluator.evaluate("Limit(" + expr + ", " + v + " -> " + p + ")");
        return result.toString();
    }

    private String simplify(String expr) {
        IExpr result = evaluator.evaluate("Simplify(" + expr + ")");
        return result.toString();
    }

    private String factor(String expr) {
        IExpr result = evaluator.evaluate("Factor(" + expr + ")");
        return result.toString();
    }

    private String solve(String expr, String var) {
        String v = var != null ? var : "x";
        IExpr result = evaluator.evaluate("Solve(" + expr + " == 0, " + v + ")");
        return result.toString();
    }

    private String matrixDeterminant(String expr) {
        IExpr result = evaluator.evaluate("Det(" + expr + ")");
        return result.toString();
    }

    private String matrixInverse(String expr) {
        IExpr result = evaluator.evaluate("Inverse(" + expr + ")");
        return result.toString();
    }

    private String eval(String expr) {
        IExpr result = evaluator.evaluate(expr);
        return result.toString();
    }
}
