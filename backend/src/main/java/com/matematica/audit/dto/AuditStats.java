package com.matematica.audit.dto;

import java.util.Map;

public record AuditStats(
    long totalEvents,
    Map<String, Long> eventsByAction,
    Map<String, Long> eventsByEntity,
    Map<String, Long> eventsByUser
) {}
