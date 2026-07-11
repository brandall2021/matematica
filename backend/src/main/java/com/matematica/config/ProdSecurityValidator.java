package com.matematica.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("prod")
public class ProdSecurityValidator implements CommandLineRunner {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${OPENAI_API_KEY:}")
    private String openaiApiKey;

    @Override
    public void run(String... args) {
        if (jwtSecret == null || jwtSecret.isBlank() || 
            jwtSecret.equals("base64SecretKeyForDevelopmentChangeInProduction")) {
            throw new IllegalStateException(
                "JWT_SECRET environment variable must be set in production profile. " +
                "Generate one with: openssl rand -base64 64");
        }
        if (openaiApiKey == null || openaiApiKey.isBlank()) {
            throw new IllegalStateException(
                "OPENAI_API_KEY environment variable must be set in production profile.");
        }
    }
}
