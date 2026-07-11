package com.matematica.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final ConcurrentHashMap<String, RateLimitBucket> buckets = new ConcurrentHashMap<>();
    
    private static final int MAX_REQUESTS_PER_MINUTE = 30;
    private static final int MAX_CHAT_REQUESTS_PER_MINUTE = 10;
    private static final long WINDOW_MS = 60_000;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String clientIp = getClientIp(request);
        String path = request.getRequestURI();
        
        int limit = path.contains("/chat/") || path.contains("/rag/") 
            ? MAX_CHAT_REQUESTS_PER_MINUTE 
            : MAX_REQUESTS_PER_MINUTE;
        
        RateLimitBucket bucket = buckets.compute(clientIp, (key, existing) -> {
            if (existing == null || existing.isExpired()) {
                return new RateLimitBucket(limit, WINDOW_MS);
            }
            return existing;
        });
        
        if (bucket.tryConsume()) {
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(bucket.getRemaining()));
            response.setHeader("X-Rate-Limit-Limit", String.valueOf(limit));
            return true;
        }
        
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader("X-Rate-Limit-Limit", String.valueOf(limit));
        response.setHeader("X-Rate-Limit-Remaining", "0");
        response.setHeader("Retry-After", "60");
        return false;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class RateLimitBucket {
        private final int maxTokens;
        private final long windowMs;
        private final AtomicInteger tokens;
        private volatile long windowStart;

        RateLimitBucket(int maxTokens, long windowMs) {
            this.maxTokens = maxTokens;
            this.windowMs = windowMs;
            this.tokens = new AtomicInteger(maxTokens);
            this.windowStart = System.currentTimeMillis();
        }

        boolean tryConsume() {
            if (isExpired()) {
                synchronized (this) {
                    if (isExpired()) {
                        tokens.set(maxTokens);
                        windowStart = System.currentTimeMillis();
                    }
                }
            }
            return tokens.decrementAndGet() >= 0;
        }

        int getRemaining() {
            return Math.max(0, tokens.get());
        }

        boolean isExpired() {
            return System.currentTimeMillis() - windowStart > windowMs;
        }
    }
}
