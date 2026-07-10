package com.matematica.documents.service;

import com.matematica.documents.domain.Document;
import com.matematica.documents.domain.DocumentType;
import com.matematica.documents.dto.*;
import com.matematica.documents.repository.DocumentRepository;
import com.matematica.indexer.service.IndexerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentParser documentParser;
    private final IndexerService indexerService;

    @Transactional
    public DocumentUploadResponse uploadDocument(MultipartFile file, String subject, String unit,
                                                  String topic, String tags, UUID userId) {
        try {
            String filename = file.getOriginalFilename();
            DocumentType type = detectType(filename);

            var parsed = documentParser.parse(file, type);
            String cleanedText = parsed.text().replaceAll("\\s+", " ").trim();

            var document = Document.builder()
                    .filename(filename)
                    .type(type)
                    .mimeType(file.getContentType())
                    .size(file.getSize())
                    .extractedText(cleanedText)
                    .author(parsed.author())
                    .title(parsed.title() != null ? parsed.title() : filename)
                    .subject(subject)
                    .unit(unit)
                    .topic(topic)
                    .tags(tags)
                    .pageCount(parsed.pageCount())
                    .uploadedBy(userId)
                    .build();

            document = documentRepository.save(document);

            indexerService.indexDocument(document);

            return new DocumentUploadResponse(
                    document.getId(), document.getFilename(),
                    "INDEXING", "Document uploaded successfully"
            );
        } catch (Exception e) {
            log.error("Error uploading document", e);
            return new DocumentUploadResponse(null, file.getOriginalFilename(), "ERROR", e.getMessage());
        }
    }

    @Transactional
    public DocumentUploadResponse addYouTubeVideo(YouTubeRequest request, UUID userId) {
        var document = Document.builder()
                .filename(request.url())
                .type(DocumentType.YOUTUBE_VIDEO)
                .title(request.url())
                .subject(request.subject())
                .unit(request.unit())
                .topic(request.topic())
                .tags(request.tags())
                .source("youtube")
                .sourceUrl(request.url())
                .uploadedBy(userId)
                .build();

        document = documentRepository.save(document);

        return new DocumentUploadResponse(
                document.getId(), document.getFilename(),
                "INDEXING", "YouTube video added for processing"
        );
    }

    public Page<DocumentResponse> listDocuments(DocumentFilter filter) {
        var pageable = PageRequest.of(filter.page(), filter.size());
        Page<Document> documents;

        if (filter.q() != null && !filter.q().isBlank()) {
            documents = documentRepository.search(filter.q(), pageable);
        } else if (filter.subject() != null) {
            documents = documentRepository.findBySubject(filter.subject(), pageable);
        } else if (filter.unit() != null) {
            documents = documentRepository.findByUnit(filter.unit(), pageable);
        } else {
            documents = documentRepository.findAll(pageable);
        }

        return documents.map(this::toResponse);
    }

    public DocumentResponse getDocument(UUID id) {
        return documentRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + id));
    }

    @Transactional
    public void deleteDocument(UUID id) {
        documentRepository.deleteById(id);
    }

    private DocumentType detectType(String filename) {
        if (filename == null) return DocumentType.TXT;
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) return DocumentType.PDF;
        if (lower.endsWith(".docx")) return DocumentType.DOCX;
        if (lower.endsWith(".pptx")) return DocumentType.PPTX;
        if (lower.endsWith(".txt")) return DocumentType.TXT;
        if (lower.endsWith(".md")) return DocumentType.MARKDOWN;
        return DocumentType.TXT;
    }

    private DocumentResponse toResponse(Document doc) {
        return new DocumentResponse(
                doc.getId(), doc.getFilename(), doc.getType().name(),
                doc.getMimeType(), doc.getSize(), doc.getAuthor(),
                doc.getTitle(), doc.getSubject(), doc.getUnit(),
                doc.getTopic(), doc.getSource(), doc.getSourceUrl(),
                doc.getPageCount(), doc.getTags(), doc.getChunkCount(),
                doc.isIndexed(), doc.getErrorMessage(), doc.getCreatedAt()
        );
    }
}
