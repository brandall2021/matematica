package com.matematica.analytics;

public record UsageStats(
    long totalRequests,
    long totalInputTokens,
    long totalOutputTokens,
    long totalTokens,
    double totalEstimatedCost,
    double avgTokensPerRequest,
    long uniqueUsers
) {}

record ModelUsage(
    String modelProvider,
    String modelName,
    long requestCount,
    long totalTokens,
    double totalCost
) {}

record DailyUsage(
    String date,
    long requestCount,
    long totalTokens,
    double totalCost
) {}

record TopUser(
    String userId,
    long requestCount,
    long totalTokens,
    double totalCost
) {}
