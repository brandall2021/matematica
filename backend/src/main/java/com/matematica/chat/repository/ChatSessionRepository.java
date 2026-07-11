package com.matematica.chat.repository;

import com.matematica.chat.domain.ChatSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {
    Page<ChatSession> findByUserIdOrderByUpdatedAtDesc(UUID userId, Pageable pageable);
    boolean existsByIdAndUserId(UUID id, UUID userId);
}
