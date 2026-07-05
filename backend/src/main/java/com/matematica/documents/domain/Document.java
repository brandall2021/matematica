package com.matematica.documents.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    private UUID id;

    @Column(nullable = false, length = 255)
    private String filename;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private DocumentType type;

    @Column(length = 50)
    private String mimeType;

    @Column(nullable = false)
    private long size;

    @Column(columnDefinition = "TEXT")
    private String extractedText;

    @Column(length = 255)
    private String author;

    @Column(length = 255)
    private String title;

    @Column(length = 100)
    private String subject;

    @Column(length = 50)
    private String unit;

    @Column(length = 100)
    private String topic;

    @Column(length = 50)
    private String source;

    @Column(length = 500)
    private String sourceUrl;

    @Column(name = "page_count")
    private Integer pageCount;

    @Column(columnDefinition = "TEXT")
    private String tags;

    @Column(name = "chunk_count")
    private int chunkCount;

    @Column(name = "indexed", nullable = false)
    private boolean indexed;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "uploaded_by")
    private UUID uploadedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        createdAt = LocalDateTime.now();
        indexed = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
