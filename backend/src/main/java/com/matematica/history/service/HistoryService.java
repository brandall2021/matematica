package com.matematica.history.service;

import com.matematica.chat.domain.ChatMessage;
import com.matematica.chat.domain.MessageRole;
import com.matematica.chat.repository.ChatMessageRepository;
import com.matematica.history.dto.HistoryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final ChatMessageRepository messageRepository;

    public Page<HistoryResponse> getHistory(UUID userId, int page, int size) {
        // In a full implementation, you'd query by userId across sessions
        var messages = messageRepository.findBySessionIdOrderByCreatedAtAsc(null);
        return Page.empty();
    }
}
