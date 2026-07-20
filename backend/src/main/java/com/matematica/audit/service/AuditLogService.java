package com.matematica.audit.service;

import com.matematica.audit.domain.AuditLog;
import com.matematica.audit.dto.AuditFilter;
import com.matematica.audit.dto.AuditStats;
import com.matematica.audit.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String action, String entityType, Long entityId, String details) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = null;
        String username = null;
        if (auth != null && auth.isAuthenticated() && auth.getName() != null) {
            userId = auth.getName();
            username = auth.getName();
        }

        String ipAddress = null;
        String userAgent = null;
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest request = attrs.getRequest();
            ipAddress = getClientIp(request);
            userAgent = request.getHeader("User-Agent");
            if (userAgent != null && userAgent.length() > 500) {
                userAgent = userAgent.substring(0, 500);
            }
        }

        AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .username(username)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getLogs(AuditFilter filter, Pageable pageable) {
        Specification<AuditLog> spec = buildSpecification(filter);
        return auditLogRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public AuditStats getStats(LocalDate from, LocalDate to) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);

        long totalEvents = auditLogRepository.countByCreatedAtBetween(fromDateTime, toDateTime);

        Map<String, Long> eventsByAction = new LinkedHashMap<>();
        auditLogRepository.countByActionBetween(fromDateTime, toDateTime)
                .forEach(row -> eventsByAction.put((String) row[0], (Long) row[1]));

        Map<String, Long> eventsByEntity = new LinkedHashMap<>();
        auditLogRepository.countByEntityTypeBetween(fromDateTime, toDateTime)
                .forEach(row -> eventsByEntity.put((String) row[0], (Long) row[1]));

        Map<String, Long> eventsByUser = new LinkedHashMap<>();
        auditLogRepository.countByUserBetween(fromDateTime, toDateTime)
                .forEach(row -> eventsByUser.put((String) row[0], (Long) row[1]));

        return new AuditStats(totalEvents, eventsByAction, eventsByEntity, eventsByUser);
    }

    private Specification<AuditLog> buildSpecification(AuditFilter filter) {
        Specification<AuditLog> spec = Specification.where(null);

        if (filter.userId() != null && !filter.userId().isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("userId"), filter.userId()));
        }
        if (filter.action() != null && !filter.action().isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("action"), filter.action()));
        }
        if (filter.entityType() != null && !filter.entityType().isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("entityType"), filter.entityType()));
        }
        if (filter.from() != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), filter.from().atStartOfDay()));
        }
        if (filter.to() != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), filter.to().atTime(LocalTime.MAX)));
        }

        return spec;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
