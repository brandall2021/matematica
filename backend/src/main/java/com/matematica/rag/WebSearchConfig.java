package com.matematica.rag;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.web-search")
@Getter
@Setter
public class WebSearchConfig {

    private boolean enabled = false;
    private String provider = "tavily";
    private String apiKey = "";
    private int maxResults = 3;
    private int timeoutSeconds = 10;
}
