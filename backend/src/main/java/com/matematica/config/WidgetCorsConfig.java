package com.matematica.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class WidgetCorsConfig {

    @Bean("widgetCorsConfigurationSource")
    public CorsConfigurationSource widgetCorsSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("*"));
        config.setAllowedMethods(List.of("POST", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "X-Widget-Key", "Authorization"));
        config.setExposedHeaders(List.of("X-Session-Id"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/widget/**", config);
        return source;
    }
}