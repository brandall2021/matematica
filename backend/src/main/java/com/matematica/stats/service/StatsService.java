package com.matematica.stats.service;

import com.matematica.documents.repository.DocumentRepository;
import com.matematica.stats.dto.AdminStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final DocumentRepository documentRepository;

    public AdminStatsResponse getAdminStats() {
        long totalDocs = documentRepository.count();
        long indexedDocs = documentRepository.countByIndexedTrue();
        return new AdminStatsResponse(totalDocs, indexedDocs, 0, 0, 0, 0, 0);
    }
}
