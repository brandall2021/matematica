package com.matematica.rag;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSearchService {

    private final WebSearchConfig config;
    private final ObjectMapper objectMapper;

    public record WebResult(String title, String url, String snippet) {}

    public List<WebResult> search(String query) {
        if (!config.isEnabled() || config.getApiKey().isBlank()) {
            log.debug("Web search disabled or no API key configured");
            return List.of();
        }

        try {
            return switch (config.getProvider()) {
                case "tavily" -> searchTavily(query);
                default -> {
                    log.warn("Unknown web search provider: {}", config.getProvider());
                    yield List.of();
                }
            };
        } catch (Exception e) {
            log.error("Web search failed for query: {}", query, e);
            return List.of();
        }
    }

    public String fetchUrl(String url) {
        try {
            var doc = Jsoup.connect(url)
                    .timeout(config.getTimeoutSeconds() * 1000)
                    .get();
            doc.select("script, style, nav, footer, header, aside").remove();
            String text = doc.body().text();
            return text.length() > 3000 ? text.substring(0, 3000) + "..." : text;
        } catch (Exception e) {
            log.error("Failed to fetch URL: {}", url, e);
            return "";
        }
    }

    public String formatWebSources(List<WebResult> results) {
        if (results.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < results.size(); i++) {
            WebResult r = results.get(i);
            sb.append(String.format("[Web %d] %s - %s", i + 1, r.title(), r.url()));
            if (i < results.size() - 1) sb.append("\n");
        }
        return sb.toString();
    }

    public String formatWebContext(List<WebResult> results) {
        if (results.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (WebResult r : results) {
            sb.append(String.format("[Fuente Web: %s]\n%s\n%s\n",
                    r.title(), r.url(), r.snippet()));
        }
        return sb.toString();
    }

    private List<WebResult> searchTavily(String query) {
        RestTemplate restTemplate = new RestTemplateBuilder()
                .setConnectTimeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                .setReadTimeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                .build();

        Map<String, Object> body = Map.of(
                "api_key", config.getApiKey(),
                "query", query,
                "max_results", config.getMaxResults(),
                "search_depth", "basic",
                "include_answer", false
        );

        var response = restTemplate.postForEntity(
                "https://api.tavily.com/search", body, String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode results = root.path("results");

        List<WebResult> webResults = new ArrayList<>();
        if (results.isArray()) {
            for (JsonNode node : results) {
                webResults.add(new WebResult(
                        node.path("title").asText(""),
                        node.path("url").asText(""),
                        node.path("content").asText("")
                ));
            }
        }
        return webResults;
    }
}
