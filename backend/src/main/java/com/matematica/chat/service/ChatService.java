package com.matematica.chat.service;

import com.matematica.chat.domain.ChatMessage;
import com.matematica.chat.domain.ChatSession;
import com.matematica.chat.domain.MessageRole;
import com.matematica.chat.dto.*;
import com.matematica.chat.repository.ChatMessageRepository;
import com.matematica.chat.repository.ChatSessionRepository;
import com.matematica.rag.dto.RagQueryRequest;
import com.matematica.rag.service.RagService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final RagService ragService;

    @Transactional
    public ChatResponse sendMessage(ChatRequest request, UUID userId) {
        ChatSession session;
        if (request.sessionId() == null) {
            session = ChatSession.builder()
                    .userId(userId)
                    .title(request.message().length() > 50
                            ? request.message().substring(0, 50) + "..."
                            : request.message())
                    .build();
            session = sessionRepository.save(session);
        } else {
            session = sessionRepository.findById(request.sessionId())
                    .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        }

        var userMessage = ChatMessage.builder()
                .sessionId(session.getId())
                .userId(userId)
                .role(MessageRole.USER)
                .content(request.message())
                .build();
        messageRepository.save(userMessage);

        var ragResponse = ragService.query(new RagQueryRequest(request.message()));

        var assistantMessage = ChatMessage.builder()
                .sessionId(session.getId())
                .userId(userId)
                .role(MessageRole.ASSISTANT)
                .content(ragResponse.answer())
                .sources(ragResponse.sources())
                .build();
        assistantMessage = messageRepository.save(assistantMessage);

        session.setMessageCount(session.getMessageCount() + 2);
        sessionRepository.save(session);

        return new ChatResponse(
                assistantMessage.getId(),
                session.getId(),
                ragResponse.answer(),
                ragResponse.sources(),
                assistantMessage.getCreatedAt()
        );
    }

    public Page<ChatSessionResponse> getSessions(UUID userId, int page, int size) {
        return sessionRepository.findByUserIdOrderByUpdatedAtDesc(userId, PageRequest.of(page, size))
                .map(s -> new ChatSessionResponse(
                        s.getId(), s.getTitle(), s.getMessageCount(),
                        s.getCreatedAt(), s.getUpdatedAt()
                ));
    }

    public List<ChatMessage> getMessages(UUID sessionId) {
        return messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }
}
