package com.matematica.audit.dto;

import java.time.LocalDate;

public record AuditFilter(
    String userId,
    String action,
    String entityType,
    LocalDate from,
    LocalDate to
) {}
