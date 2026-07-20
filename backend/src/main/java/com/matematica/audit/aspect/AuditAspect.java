package com.matematica.audit.aspect;

import com.matematica.audit.annotation.AuditLogAction;
import com.matematica.audit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditLogService auditLogService;

    @Around("@annotation(com.matematica.audit.annotation.AuditLogAction)")
    public Object auditMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        AuditLogAction annotation = method.getAnnotation(AuditLogAction.class);

        String action = annotation.action();
        String entityType = annotation.entityType();

        Object result = joinPoint.proceed();

        try {
            Long entityId = extractEntityId(result);
            auditLogService.log(action, entityType, entityId, null);
        } catch (Exception e) {
            // Don't let audit logging failures affect business logic
        }

        return result;
    }

    private Long extractEntityId(Object result) {
        if (result == null) return null;
        if (result instanceof Long) return (Long) result;
        if (result instanceof Number) return ((Number) result).longValue();
        // Try to get 'id' field via reflection for DTOs
        try {
            var idField = result.getClass().getDeclaredField("id");
            idField.setAccessible(true);
            Object idValue = idField.get(result);
            if (idValue instanceof Long) return (Long) idValue;
            if (idValue instanceof Number) return ((Number) idValue).longValue();
        } catch (Exception ignored) {}
        return null;
    }
}
