package com.matematica.rag.dto;

public record RagQueryResponse(String answer, String sources, int contextChunksUsed) {}
