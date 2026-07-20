package com.matematica.rag.dto;

public record RagQueryResponse(
    String answer,
    String sources,
    String webSources,
    int contextChunksUsed
) {
    public RagQueryResponse(String answer, String sources, int contextChunksUsed) {
        this(answer, sources, "", contextChunksUsed);
    }
}
