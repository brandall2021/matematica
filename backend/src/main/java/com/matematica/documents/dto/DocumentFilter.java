package com.matematica.documents.dto;

public record DocumentFilter(String q, String subject, String unit, String type, Integer page, Integer size) {
    public DocumentFilter {
        if (page == null || page < 0) page = 0;
        if (size == null || size <= 0) size = 20;
    }
}
