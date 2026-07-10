package com.matematica.chat.repository;

import com.matematica.chat.domain.ChatMessage;
import com.matematica.chat.domain.MessageRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);
    Page<ChatMessage> findBySessionIdInOrderByCreatedAtDesc(List<UUID> sessionIds, Pageable pageable);
    long countByCreatedAtAfter(LocalDateTime after);
    long countByRole(MessageRole role);

    @Query("SELECT COALESCE(SUM(LENGTH(m.content)), 0) FROM ChatMessage m WHERE m.role = :role")
    long sumContentLengthByRole(@Param("role") MessageRole role);
}
