package com.matematica.chat.controller;

import com.matematica.chat.domain.ChatMessage;
import com.matematica.chat.dto.*;
import com.matematica.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/message")
    public ResponseEntity<ChatResponse> sendMessage(
            @Valid @RequestBody ChatRequest request,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(chatService.sendMessage(request, userId));
    }

    @GetMapping("/sessions")
    public ResponseEntity<Page<ChatSessionResponse>> getSessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        int validPage = Math.max(0, page);
        int validSize = Math.min(100, Math.max(1, size));
        return ResponseEntity.ok(chatService.getSessions(userId, validPage, validSize));
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(
            @PathVariable UUID sessionId,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        var messages = chatService.getMessages(sessionId, userId);
        return ResponseEntity.ok(messages);
    }
}
