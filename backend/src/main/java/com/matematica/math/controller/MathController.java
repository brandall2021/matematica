package com.matematica.math.controller;

import com.matematica.math.dto.MathRequest;
import com.matematica.math.dto.MathResponse;
import com.matematica.math.service.MathService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/math")
@RequiredArgsConstructor
public class MathController {

    private final MathService mathService;

    @PostMapping("/evaluate")
    public ResponseEntity<MathResponse> evaluate(@Valid @RequestBody MathRequest request) {
        return ResponseEntity.ok(mathService.evaluate(request));
    }
}
