package com.matematica.indexer.controller;

import com.matematica.indexer.service.IndexerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/indexer")
@RequiredArgsConstructor
public class IndexerController {

    private final IndexerService indexerService;

    @PostMapping("/reindex")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reindexAll() {
        indexerService.reindexAll();
        return ResponseEntity.accepted().build();
    }
}
