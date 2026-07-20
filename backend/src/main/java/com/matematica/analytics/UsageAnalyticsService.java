package com.matematica.analytics;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsageAnalyticsService {

    private final UsageLogRepository usageLogRepository;

    @Transactional
    public UsageLog logUsage(UsageLog usageLog) {
        return usageLogRepository.save(usageLog);
    }

    public UsageStats getStats(LocalDate from, LocalDate to) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.plusDays(1).atStartOfDay();

        long totalRequests = usageLogRepository.countByDateRange(fromDateTime, toDateTime);
        long totalInputTokens = usageLogRepository.sumInputTokensByDateRange(fromDateTime, toDateTime);
        long totalOutputTokens = usageLogRepository.sumOutputTokensByDateRange(fromDateTime, toDateTime);
        long totalTokens = usageLogRepository.sumTotalTokensByDateRange(fromDateTime, toDateTime);
        double totalCost = usageLogRepository.sumEstimatedCostByDateRange(fromDateTime, toDateTime);
        long uniqueUsers = usageLogRepository.countDistinctUsersByDateRange(fromDateTime, toDateTime);
        double avgTokens = totalRequests > 0 ? (double) totalTokens / totalRequests : 0;

        return new UsageStats(
            totalRequests,
            totalInputTokens,
            totalOutputTokens,
            totalTokens,
            totalCost,
            avgTokens,
            uniqueUsers
        );
    }

    public List<DailyUsage> getDailyUsage(LocalDate from, LocalDate to) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.plusDays(1).atStartOfDay();

        return usageLogRepository.dailyUsageByDateRange(fromDateTime, toDateTime)
            .stream()
            .map(row -> new DailyUsage(
                (String) row[0],
                (Long) row[1],
                ((Number) row[2]).longValue(),
                ((Number) row[3]).doubleValue()
            ))
            .collect(Collectors.toList());
    }

    public List<ModelUsage> getModelBreakdown(LocalDate from, LocalDate to) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.plusDays(1).atStartOfDay();

        return usageLogRepository.modelBreakdownByDateRange(fromDateTime, toDateTime)
            .stream()
            .map(row -> new ModelUsage(
                (String) row[0],
                (String) row[1],
                (Long) row[2],
                ((Number) row[3]).longValue(),
                ((Number) row[4]).doubleValue()
            ))
            .collect(Collectors.toList());
    }

    public List<TopUser> getTopUsers(LocalDate from, LocalDate to) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.plusDays(1).atStartOfDay();

        return usageLogRepository.topUsersByDateRange(fromDateTime, toDateTime)
            .stream()
            .map(row -> new TopUser(
                (String) row[0],
                (Long) row[1],
                ((Number) row[2]).longValue(),
                ((Number) row[3]).doubleValue()
            ))
            .collect(Collectors.toList());
    }

    public Map<String, Object> getOverview() {
        LocalDate now = LocalDate.now();
        LocalDate thirtyDaysAgo = now.minusDays(30);

        UsageStats stats = getStats(thirtyDaysAgo, now);
        List<DailyUsage> daily = getDailyUsage(thirtyDaysAgo, now);
        List<ModelUsage> models = getModelBreakdown(thirtyDaysAgo, now);
        List<TopUser> topUsers = getTopUsers(thirtyDaysAgo, now);

        Map<String, Object> overview = new HashMap<>();
        overview.put("stats", stats);
        overview.put("dailyUsage", daily);
        overview.put("modelBreakdown", models);
        overview.put("topUsers", topUsers);
        return overview;
    }
}
