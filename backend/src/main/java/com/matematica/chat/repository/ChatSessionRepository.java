package com.matematica.chat.repository;

import com.matematica.chat.domain.ChatSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {
    Page<ChatSession> findByUserIdOrderByUpdatedAtDesc(UUID userId, Pageable pageable);
    boolean existsByIdAndUserId(UUID id, UUID userId);
    Optional<ChatSession> findByIdAndUserId(UUID id, UUID userId);

    @Modifying
    @Query("UPDATE ChatSession s SET s.messageCount = s.messageCount + :increment WHERE s.id = :id")
    void incrementMessageCount(@Param("id") UUID id, @Param("increment") int increment);
}
