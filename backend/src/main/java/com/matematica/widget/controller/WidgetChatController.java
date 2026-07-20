package com.matematica.widget.controller;

import com.matematica.chat.dto.ChatRequest;
import com.matematica.chat.dto.ChatResponse;
import com.matematica.chat.service.ChatService;
import com.matematica.widget.WidgetApiKeyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/widget")
@RequiredArgsConstructor
public class WidgetChatController {

    private final ChatService chatService;
    private final WidgetApiKeyService widgetApiKeyService;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request,
            @RequestHeader(value = "X-Widget-Key", required = false) String widgetKey,
            @RequestHeader(value = "Origin", required = false) String origin,
            HttpServletRequest httpRequest) {

        if (!widgetApiKeyService.validateKey(widgetKey)) {
            return ResponseEntity.status(403).build();
        }

        if (!widgetApiKeyService.isKeyForSite(widgetKey, origin)) {
            return ResponseEntity.status(403).build();
        }

        UUID anonymousUserId = UUID.fromString("00000000-0000-0000-0000-000000000001");

        ChatResponse response = chatService.sendMessage(request, anonymousUserId);
        return ResponseEntity.ok(response);
    }
}