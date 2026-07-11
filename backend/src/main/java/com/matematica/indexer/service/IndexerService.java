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

    private static final int MAX_CHARS = 100_000;
    private static final int BATCH_SIZE = 50;

    @Async
    public void indexDocument(Document document) {
        try {
            String text = document.getExtractedText();
            if (text == null || text.isBlank()) {
                transactionTemplate.executeWithoutResult(status -> {
                    document.setErrorMessage("No text extracted");
                    documentRepository.save(document);
                });
                return;
            }

            if (text.length() > MAX_CHARS) {
                text = text.substring(0, MAX_CHARS);
                log.warn("Document {} truncated to {} chars", document.getId(), MAX_CHARS);
            }

            String docId = document.getId().toString();
            String filename = document.getFilename();
            String title = document.getTitle();
            String author = document.getAuthor();
            String subject = document.getSubject();
            String unit = document.getUnit();
            String topic = document.getTopic();
            String source = document.getSource();
            String sourceUrl = document.getSourceUrl();
            String typeName = document.getType().name();

            List<org.springframework.ai.document.Document> chunks = textSplitter.split(text, chunkSize, chunkOverlap);
            text = null;

            int totalChunks = chunks.size();
            int indexed = 0;

            for (int i = 0; i < totalChunks; i += BATCH_SIZE) {
                int end = Math.min(i + BATCH_SIZE, totalChunks);
                List<org.springframework.ai.document.Document> batch = new ArrayList<>(end - i);

                for (int j = i; j < end; j++) {
                    org.springframework.ai.document.Document chunk = new org.springframework.ai.document.Document(chunks.get(j).getContent());
                    chunk.getMetadata().put("documentId", docId);
                    chunk.getMetadata().put("chunkIndex", j);
                    chunk.getMetadata().put("filename", filename);
                    chunk.getMetadata().put("title", title);
                    chunk.getMetadata().put("author", author);
                    chunk.getMetadata().put("subject", subject);
                    chunk.getMetadata().put("unit", unit);
                    chunk.getMetadata().put("topic", topic);
                    chunk.getMetadata().put("source", source);
                    chunk.getMetadata().put("sourceUrl", sourceUrl);
                    chunk.getMetadata().put("type", typeName);
                    batch.add(chunk);
                }

                vectorStore.add(batch);
                indexed += batch.size();
                System.gc();
                log.debug("Indexed batch {}/{} for document {}", indexed, totalChunks, document.getId());
            }

            chunks = null;
            System.gc();

            transactionTemplate.executeWithoutResult(status -> {
                document.setChunkCount(indexed);
                document.setIndexed(true);
                document.setErrorMessage(null);
                documentRepository.save(document);
            });

            log.info("Indexed document {} with {} chunks", document.getId(), indexed);
        } catch (Exception e) {
            log.error("Error indexing document {}", document.getId(), e);
            transactionTemplate.executeWithoutResult(status -> {
                document.setErrorMessage(e.getMessage());
                documentRepository.save(document);
            });
        }
    }

    @Async
    public void reindexAll() {
        var documents = documentRepository.findByIndexedFalse();
        for (var doc : documents) {
            indexDocument(doc);
        }
    }
}
