package com.matematica.analytics;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface UsageLogRepository extends JpaRepository<UsageLog, Long> {

    @Query("SELECT COUNT(u) FROM UsageLog u WHERE u.createdAt BETWEEN :from AND :to")
    long countByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(u.inputTokens), 0) FROM UsageLog u WHERE u.createdAt BETWEEN :from AND :to")
    long sumInputTokensByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(u.outputTokens), 0) FROM UsageLog u WHERE u.createdAt BETWEEN :from AND :to")
    long sumOutputTokensByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(u.totalTokens), 0) FROM UsageLog u WHERE u.createdAt BETWEEN :from AND :to")
    long sumTotalTokensByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(u.estimatedCost), 0.0) FROM UsageLog u WHERE u.createdAt BETWEEN :from AND :to")
    double sumEstimatedCostByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(DISTINCT u.userId) FROM UsageLog u WHERE u.createdAt BETWEEN :from AND :to")
    long countDistinctUsersByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT u.modelProvider AS provider, u.modelName AS name, " +
           "COUNT(u) AS requestCount, COALESCE(SUM(u.totalTokens), 0) AS totalTokens, " +
           "COALESCE(SUM(u.estimatedCost), 0.0) AS totalCost " +
           "FROM UsageLog u WHERE u.createdAt BETWEEN :from AND :to " +
           "GROUP BY u.modelProvider, u.modelName ORDER BY COUNT(u) DESC")
    List<Object[]> modelBreakdownByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT FUNCTION('TO_CHAR', u.createdAt, 'YYYY-MM-DD') AS date, " +
           "COUNT(u) AS requestCount, COALESCE(SUM(u.totalTokens), 0) AS totalTokens, " +
           "COALESCE(SUM(u.estimatedCost), 0.0) AS totalCost " +
           "FROM UsageLog u WHERE u.createdAt BETWEEN :from AND :to " +
           "GROUP BY FUNCTION('TO_CHAR', u.createdAt, 'YYYY-MM-DD') ORDER BY date")
    List<Object[]> dailyUsageByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT u.userId, COUNT(u) AS requestCount, " +
           "COALESCE(SUM(u.totalTokens), 0) AS totalTokens, " +
           "COALESCE(SUM(u.estimatedCost), 0.0) AS totalCost " +
           "FROM UsageLog u WHERE u.createdAt BETWEEN :from AND :to " +
           "GROUP BY u.userId ORDER BY SUM(u.totalTokens) DESC")
    List<Object[]> topUsersByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    List<UsageLog> findByUserIdOrderByCreatedAtDesc(String userId);

    List<UsageLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);
}
