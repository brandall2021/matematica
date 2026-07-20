package com.matematica.analytics;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UsageAnalyticsController {

    private final UsageAnalyticsService usageAnalyticsService;

    @PostMapping("/log")
    public ResponseEntity<UsageLog> logUsage(@RequestBody UsageLog usageLog) {
        return ResponseEntity.ok(usageAnalyticsService.logUsage(usageLog));
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        return ResponseEntity.ok(usageAnalyticsService.getOverview());
    }

    @GetMapping("/stats")
    public ResponseEntity<UsageStats> getStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(usageAnalyticsService.getStats(from, to));
    }

    @GetMapping("/daily")
    public ResponseEntity<List<DailyUsage>> getDailyUsage(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(usageAnalyticsService.getDailyUsage(from, to));
    }

    @GetMapping("/models")
    public ResponseEntity<List<ModelUsage>> getModelBreakdown(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(usageAnalyticsService.getModelBreakdown(from, to));
    }

    @GetMapping("/top-users")
    public ResponseEntity<List<TopUser>> getTopUsers(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(usageAnalyticsService.getTopUsers(from, to));
    }
}
