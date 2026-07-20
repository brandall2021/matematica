package com.matematica.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("prod")
public class ProdSecurityValidator implements CommandLineRunner {

    @Value("${OPENAI_API_KEY:}")
    private String openaiApiKey;

    @Override
    public void run(String... args) {
        if (openaiApiKey == null || openaiApiKey.isBlank()) {
            throw new IllegalStateException(
                "OPENAI_API_KEY environment variable must be set in production profile.");
        }
    }
}
