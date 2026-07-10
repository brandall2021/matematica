package com.matematica.documents.dto;

public record DocumentFilter(String q, String subject, String unit, String type, int page, int size) {
    public DocumentFilter {
        if (page < 0) page = 0;
        if (size <= 0) size = 20;
    }
}
