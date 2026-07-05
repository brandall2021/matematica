package com.matematica.stats.dto;

public record AdminStatsResponse(
    long totalDocuments,
    long indexedDocuments,
    long dailyQueries,
    long totalChatSessions,
    double avgResponseTime,
    long totalTokensUsed,
    double avgRagPrecision
) {}
