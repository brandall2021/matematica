package com.matematica.indexer.service;

import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TextSplitter {

    public List<Document> split(String text, int chunkSize, int chunkOverlap) {
        List<Document> chunks = new ArrayList<>();
        int start = 0;
        int index = 0;

        while (start < text.length()) {
            int end = Math.min(start + chunkSize, text.length());

            if (end < text.length()) {
                int lastPeriod = text.lastIndexOf('.', end);
                int lastNewline = text.lastIndexOf('\n', end);
                int splitPoint = Math.max(lastPeriod, lastNewline);
                if (splitPoint > start) {
                    end = splitPoint + 1;
                }
            }

            String chunkText = text.substring(start, Math.min(end, text.length())).trim();
            if (!chunkText.isEmpty()) {
                chunks.add(new Document(chunkText));
            }

            start = end - chunkOverlap;
            if (start >= text.length() || start >= end) break;
            index++;
        }

        return chunks;
    }
}
