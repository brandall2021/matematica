package com.matematica.widget;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class WidgetApiKeyService {

    @Value("${app.widget.master-key:}")
    private String masterKey;

    private final Map<String, WidgetKeyInfo> validKeys = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        if (masterKey != null && !masterKey.isEmpty()) {
            log.info("Widget API key validation enabled");
        } else {
            log.warn("Widget master key not configured. Widget requests will be accepted without validation.");
        }
    }

    public boolean validateKey(String widgetKey) {
        if (masterKey == null || masterKey.isEmpty()) {
            return true;
        }

        if (widgetKey == null || widgetKey.isEmpty()) {
            return false;
        }

        return validKeys.containsKey(widgetKey);
    }

    public String generateKey(String siteName, String allowedOrigin) {
        String rawKey = UUID.randomUUID().toString();
        String hashedKey = hashKey(rawKey);

        validKeys.put(hashedKey, new WidgetKeyInfo(siteName, allowedOrigin, System.currentTimeMillis()));

        log.info("Generated widget key for site: {} (key: {}...)", siteName, rawKey.substring(0, 8));

        return rawKey;
    }

    public void revokeKey(String hashedKey) {
        validKeys.remove(hashedKey);
        log.info("Revoked widget key: {}...", hashedKey.substring(0, 8));
    }

    public boolean isKeyForSite(String widgetKey, String origin) {
        WidgetKeyInfo info = validKeys.get(widgetKey);
        if (info == null) {
            return false;
        }
        return "*".equals(info.allowedOrigin) || origin.contains(info.allowedOrigin);
    }

    private String hashKey(String key) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(key.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    public record WidgetKeyInfo(String siteName, String allowedOrigin, long createdAt) {}
}