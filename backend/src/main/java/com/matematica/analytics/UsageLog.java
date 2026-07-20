package com.matematica.analytics;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usage_logs", indexes = {
    @Index(name = "idx_usage_logs_user_id", columnList = "userId"),
    @Index(name = "idx_usage_logs_created_at", columnList = "createdAt"),
    @Index(name = "idx_usage_logs_model_provider", columnList = "modelProvider")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 255)
    private String userId;

    @Column(name = "model_provider", nullable = false, length = 50)
    private String modelProvider;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "input_tokens")
    private Integer inputTokens;

    @Column(name = "output_tokens")
    private Integer outputTokens;

    @Column(name = "total_tokens")
    private Integer totalTokens;

    @Column(name = "estimated_cost")
    private Double estimatedCost;

    @Column(name = "operation_type", nullable = false, length = 50)
    private String operationType;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (totalTokens == null) {
            totalTokens = (inputTokens != null ? inputTokens : 0) + (outputTokens != null ? outputTokens : 0);
        }
    }
}
