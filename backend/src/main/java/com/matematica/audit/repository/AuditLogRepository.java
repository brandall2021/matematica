package com.matematica.audit.repository;

import com.matematica.audit.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    Page<AuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);

    @Query("SELECT a.action, COUNT(a) FROM AuditLog a WHERE a.createdAt BETWEEN :from AND :to GROUP BY a.action ORDER BY COUNT(a) DESC")
    List<Object[]> countByActionBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT a.entityType, COUNT(a) FROM AuditLog a WHERE a.createdAt BETWEEN :from AND :to GROUP BY a.entityType ORDER BY COUNT(a) DESC")
    List<Object[]> countByEntityTypeBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT a.userId, COUNT(a) FROM AuditLog a WHERE a.createdAt BETWEEN :from AND :to GROUP BY a.userId ORDER BY COUNT(a) DESC")
    List<Object[]> countByUserBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    @Query("SELECT a FROM AuditLog a WHERE a.createdAt BETWEEN :from AND :to ORDER BY a.createdAt DESC")
    Page<AuditLog> findByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);
}
