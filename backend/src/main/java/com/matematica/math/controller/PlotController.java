package com.matematica.math.controller;

import com.matematica.math.dto.PlotRequest;
import com.matematica.math.dto.PlotResponse;
import com.matematica.math.service.MathService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/math")
@RequiredArgsConstructor
public class PlotController {

    private final MathService mathService;

    @PostMapping("/plot")
    public ResponseEntity<PlotResponse> plot(@Valid @RequestBody PlotRequest request) {
        PlotResponse response = mathService.computePlotData(
            request.expression(),
            request.variable(),
            request.xMin(),
            request.xMax(),
            request.yMin(),
            request.yMax()
        );
        return ResponseEntity.ok(response);
    }
}
