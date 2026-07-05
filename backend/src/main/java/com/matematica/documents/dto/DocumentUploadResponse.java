package com.matematica.documents.dto;

import java.util.UUID;

public record DocumentUploadResponse(UUID id, String filename, String status, String message) {}
