package com.matematica.rag.controller;

import com.matematica.rag.dto.RagQueryRequest;
import com.matematica.rag.dto.RagQueryResponse;
import com.matematica.rag.service.RagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rag")
@RequiredArgsConstructor
public class RagController {

    private final RagService ragService;

    @PostMapping("/query")
    public ResponseEntity<RagQueryResponse> query(@Valid @RequestBody RagQueryRequest request) {
        return ResponseEntity.ok(ragService.query(request));
    }
}
