package com.matematica.history.service;

import com.matematica.chat.domain.ChatMessage;
import com.matematica.chat.domain.ChatSession;
import com.matematica.chat.repository.ChatMessageRepository;
import com.matematica.chat.repository.ChatSessionRepository;
import com.matematica.history.dto.HistoryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final ChatMessageRepository messageRepository;
    private final ChatSessionRepository sessionRepository;

    public Page<HistoryResponse> getHistory(UUID userId, int page, int size) {
        var sessions = sessionRepository.findByUserIdOrderByUpdatedAtDesc(userId, PageRequest.of(0, 100));
        var sessionIds = sessions.getContent().stream()
                .map(ChatSession::getId)
                .toList();

        if (sessionIds.isEmpty()) {
            return Page.empty();
        }

        var messages = messageRepository.findBySessionIdInOrderByCreatedAtDesc(sessionIds, PageRequest.of(page, size));

        var sessionTitles = sessions.getContent().stream()
                .collect(Collectors.toMap(ChatSession::getId, ChatSession::getTitle));

        List<HistoryResponse> responses = messages.getContent().stream()
                .map(msg -> new HistoryResponse(
                        msg.getId(),
                        msg.getSessionId(),
                        sessionTitles.getOrDefault(msg.getSessionId(), "Chat"),
                        msg.getRole().name(),
                        msg.getContent(),
                        msg.getSources(),
                        msg.getCreatedAt()
                ))
                .toList();

        return new PageImpl<>(responses, PageRequest.of(page, size), messages.getTotalElements());
    }
}
