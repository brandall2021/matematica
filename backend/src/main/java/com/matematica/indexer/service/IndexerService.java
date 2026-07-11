package com.matematica.indexer.service;

import com.matematica.documents.domain.Document;
import com.matematica.documents.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class IndexerService {

    private final DocumentRepository documentRepository;
    private final EmbeddingModel embeddingModel;
    private final VectorStore vectorStore;
    private final TextSplitter textSplitter;
    private final TransactionTemplate transactionTemplate;

    @Value("${app.rag.chunk-size:512}")
    private int chunkSize;

    @Value("${app.rag.chunk-overlap:64}")
    private int chunkOverlap;

    @Async
    public void indexDocument(Document document) {
        transactionTemplate.executeWithoutResult(status -> {
            try {
                String text = document.getExtractedText();
                if (text == null || text.isBlank()) {
                    document.setErrorMessage("No text extracted");
                    documentRepository.save(document);
                    return;
                }

                int maxChars = 500_000;
                if (text.length() > maxChars) {
                    text = text.substring(0, maxChars);
                    log.warn("Document {} truncated from original to {} chars", document.getId(), maxChars);
                }

                List<org.springframework.ai.document.Document> chunks = textSplitter.split(text, chunkSize, chunkOverlap);

                List<org.springframework.ai.document.Document> aiDocs = new ArrayList<>();
                for (int i = 0; i < chunks.size(); i++) {
                    org.springframework.ai.document.Document chunk = new org.springframework.ai.document.Document(chunks.get(i).getContent());
                    chunk.getMetadata().put("documentId", document.getId().toString());
                    chunk.getMetadata().put("chunkIndex", i);
                    chunk.getMetadata().put("filename", document.getFilename());
                    chunk.getMetadata().put("title", document.getTitle());
                    chunk.getMetadata().put("author", document.getAuthor());
                    chunk.getMetadata().put("subject", document.getSubject());
                    chunk.getMetadata().put("unit", document.getUnit());
                    chunk.getMetadata().put("topic", document.getTopic());
                    chunk.getMetadata().put("source", document.getSource());
                    chunk.getMetadata().put("sourceUrl", document.getSourceUrl());
                    chunk.getMetadata().put("type", document.getType().name());
                    aiDocs.add(chunk);
                }

                vectorStore.add(aiDocs);

                document.setChunkCount(aiDocs.size());
                document.setIndexed(true);
                document.setErrorMessage(null);
                documentRepository.save(document);

                log.info("Indexed document {} with {} chunks", document.getId(), aiDocs.size());
            } catch (Exception e) {
                log.error("Error indexing document {}", document.getId(), e);
                document.setErrorMessage(e.getMessage());
                documentRepository.save(document);
            }
        });
    }

    @Async
    public void reindexAll() {
        var documents = documentRepository.findByIndexedFalse();
        for (var doc : documents) {
            indexDocument(doc);
        }
    }
}
