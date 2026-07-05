package com.matematica.documents.controller;

import com.matematica.documents.dto.*;
import com.matematica.documents.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'ASSISTANT')")
    public ResponseEntity<DocumentUploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String unit,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String tags,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentService.uploadDocument(file, subject, unit, topic, tags, userId));
    }

    @PostMapping("/youtube")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'ASSISTANT')")
    public ResponseEntity<DocumentUploadResponse> addYouTube(
            @Valid @RequestBody YouTubeRequest request,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentService.addYouTubeVideo(request, userId));
    }

    @GetMapping
    public ResponseEntity<Page<DocumentResponse>> list(DocumentFilter filter) {
        return ResponseEntity.ok(documentService.listDocuments(filter));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(documentService.getDocument(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}
