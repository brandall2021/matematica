# Web Search Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add web search capability as a fallback when the local RAG knowledge base lacks sufficient information for a math query.

**Architecture:** A new `WebSearchService` calls the Tavily Search API via REST. `RagService` is modified to check the quality of local RAG results (based on similarity scores from Qdrant) and, when below threshold, augment context with web search results. The frontend gains a toggle to enable/disable web search per message.

**Tech Stack:** Spring Boot 3.3, Spring AI 1.0.0-M2, RestClient (Spring Boot 3.3 built-in), Tavily Search API, Angular 20, Angular Material, KaTeX

## Global Constraints

- Java 21, Spring Boot 3.3.0, Spring AI 1.0.0-M2
- Angular 20, Angular Material 20
- No new npm dependencies (use existing Mat modules)
- Backend REST API pattern: `/api/...`
- Environment variables for secrets (never hardcoded)

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `backend/.../rag/WebSearchService.java` | Calls Tavily API, fetches URL content |
| Create | `backend/.../rag/WebSearchConfig.java` | Configuration properties for web search |
| Modify | `backend/.../rag/dto/RagQueryRequest.java` | Add `webSearchEnabled` field |
| Modify | `backend/.../rag/dto/RagQueryResponse.java` | Add `webSources` field |
| Modify | `backend/.../rag/service/RagService.java` | Add web search fallback logic |
| Modify | `backend/.../chat/dto/ChatRequest.java` | Add `webSearchEnabled` field |
| Modify | `backend/.../chat/dto/ChatResponse.java` | Add `webSources` field |
| Modify | `backend/.../chat/service/ChatService.java` | Pass webSearchEnabled to RAG |
| Modify | `backend/src/main/resources/application.yml` | Add web-search config section |
| Modify | `backend/pom.xml` | Add jsoup dependency for HTML parsing |
| Modify | `frontend/.../chat/chat.component.ts` | Add web search toggle + web source display |
| Modify | `frontend/.../core/services/api.service.ts` | Update DTOs for web search fields |

---

### Task 1: Add Dependencies and Configuration

**Files:**
- Modify: `backend/pom.xml`
- Modify: `backend/src/main/resources/application.yml`

- [ ] **Step 1: Add jsoup dependency to pom.xml**

Add after the existing tika dependencies:

```xml
<!-- Web Content Parsing -->
<dependency>
    <groupId>org.jsoup</groupId>
    <artifactId>jsoup</artifactId>
    <version>1.18.1</version>
</dependency>
```

- [ ] **Step 2: Add web search config to application.yml**

Add under the `app:` section:

```yaml
  web-search:
    enabled: ${WEB_SEARCH_ENABLED:false}
    provider: tavily
    api-key: ${WEB_SEARCH_API_KEY:}
    max-results: 3
    timeout-seconds: 10
```

- [ ] **Step 3: Verify Maven resolves**

Run: `cd /home/proyecto/matematica/backend && mvn dependency:resolve -q 2>&1 | tail -5`
Expected: BUILD SUCCESS

---

### Task 2: Create WebSearchConfig

**Files:**
- Create: `backend/src/main/java/com/matematica/rag/WebSearchConfig.java`

- [ ] **Step 1: Create the configuration class**

```java
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
```

---

### Task 3: Create WebSearchService

**Files:**
- Create: `backend/src/main/java/com/matematica/rag/WebSearchService.java`

- [ ] **Step 1: Create WebSearchService**

```java
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
```

---

### Task 4: Update DTOs

**Files:**
- Modify: `backend/src/main/java/com/matematica/rag/dto/RagQueryRequest.java`
- Modify: `backend/src/main/java/com/matematica/rag/dto/RagQueryResponse.java`
- Modify: `backend/src/main/java/com/matematica/chat/dto/ChatRequest.java`
- Modify: `backend/src/main/java/com/matematica/chat/dto/ChatResponse.java`

- [ ] **Step 1: Update RagQueryRequest**

```java
package com.matematica.rag.dto;

import jakarta.validation.constraints.NotBlank;

public record RagQueryRequest(
    @NotBlank String query,
    boolean webSearchEnabled
) {
    public RagQueryRequest(String query) {
        this(query, false);
    }
}
```

- [ ] **Step 2: Update RagQueryResponse**

```java
package com.matematica.rag.dto;

public record RagQueryResponse(
    String answer,
    String sources,
    String webSources,
    int contextChunksUsed
) {
    public RagQueryResponse(String answer, String sources, int contextChunksUsed) {
        this(answer, sources, "", contextChunksUsed);
    }
}
```

- [ ] **Step 3: Update ChatRequest**

```java
package com.matematica.chat.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record ChatRequest(
    UUID sessionId,
    @NotBlank String message,
    boolean webSearchEnabled
) {}
```

- [ ] **Step 4: Update ChatResponse**

```java
package com.matematica.chat.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatResponse(
    UUID messageId,
    UUID sessionId,
    String answer,
    String sources,
    String webSources,
    LocalDateTime timestamp
) {}
```

---

### Task 5: Modify RagService with Web Search Fallback

**Files:**
- Modify: `backend/src/main/java/com/matematica/rag/service/RagService.java`

- [ ] **Step 1: Update RagService**

Replace the entire file with:

```java
package com.matematica.rag.service;

import com.matematica.rag.WebSearchService;
import com.matematica.rag.dto.RagQueryRequest;
import com.matematica.rag.dto.RagQueryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RagService {

    private final VectorStore vectorStore;
    private final ChatModel chatModel;
    private final WebSearchService webSearchService;

    @Value("${app.rag.top-k:10}")
    private int topK;

    @Value("${app.rag.similarity-threshold:0.75}")
    private double similarityThreshold;

    private static final String SYSTEM_PROMPT = """
        Eres un tutor de matemática universitario. Tu función es enseñar, no solo responder.
        
        Reglas:
        1. Usa SIEMPRE el contexto proporcionado para responder.
        2. SIEMPRE cita las fuentes al final (ej: "Fuente: Apunte Unidad 3, Página 18").
        3. Si el contexto no es suficiente para responder, indícalo claramente.
        4. Explica los conceptos paso a paso.
        5. Si el usuario pide un ejercicio, resuélvelo paso a paso.
        6. No inventes información que no esté en el contexto.
        7. Usa notación matemática cuando sea apropiado.
        8. Adáptate al nivel del alumno.
        """;

    private static final String WEB_SEARCH_PROMPT_ADDON = """
        
        NOTA: También se proporcionaron resultados de búsqueda web. Si el contexto local no es suficiente, usa la información web como complemento. Indica claramente cuando cites una fuente web.
        """;

    public RagQueryResponse query(RagQueryRequest request) {
        try {
            SearchRequest searchRequest = SearchRequest.query(request.query())
                    .withTopK(topK)
                    .withSimilarityThreshold(similarityThreshold);

            List<Document> results = vectorStore.similaritySearch(searchRequest);

            String context = results.stream()
                    .map(doc -> formatContext(doc))
                    .collect(Collectors.joining("\n\n---\n\n"));

            String sources = results.stream()
                    .map(doc -> formatSource(doc))
                    .distinct()
                    .collect(Collectors.joining("\n"));

            String webContext = "";
            String webSources = "";

            if (request.webSearchEnabled() && results.size() < 3) {
                log.info("Low RAG results ({}), falling back to web search for: {}",
                        results.size(), request.query());
                var webResults = webSearchService.search(request.query());
                if (!webResults.isEmpty()) {
                    webContext = webSearchService.formatWebContext(webResults);
                    webSources = webSearchService.formatWebSources(webResults);
                }
            }

            String fullContext = context;
            String systemPrompt = SYSTEM_PROMPT;
            if (!webContext.isEmpty()) {
                fullContext = context.isEmpty()
                        ? "Información de la web:\n" + webContext
                        : context + "\n\n---\n\nInformación de la web:\n" + webContext;
                systemPrompt += WEB_SEARCH_PROMPT_ADDON;
            }

            var systemMsg = new SystemMessage(systemPrompt + "\n\nContexto:\n" + fullContext);
            var userMsg = new UserMessage(request.query());

            var response = chatModel.call(systemMsg, userMsg);

            return new RagQueryResponse(
                    response,
                    sources,
                    webSources,
                    results.size()
            );
        } catch (Exception e) {
            log.error("Error in RAG query", e);
            return new RagQueryResponse(
                    "Lo siento, ocurrió un error al procesar tu consulta.",
                    "",
                    "",
                    0
            );
        }
    }

    private String formatContext(Document doc) {
        var meta = doc.getMetadata();
        return String.format("[%s] %s\n%s",
                meta.getOrDefault("type", "Desconocido"),
                meta.getOrDefault("title", "Sin título"),
                doc.getContent());
    }

    private String formatSource(Document doc) {
        var meta = doc.getMetadata();
        String type = (String) meta.getOrDefault("type", "Documento");
        String title = (String) meta.getOrDefault("title", "Sin título");
        String unit = (String) meta.getOrDefault("unit", "");
        String sourceUrl = (String) meta.getOrDefault("sourceUrl", "");

        if ("YOUTUBE_VIDEO".equals(type) && !sourceUrl.isBlank()) {
            return "Video: " + title + " (" + sourceUrl + ")";
        }
        if (!unit.isBlank()) {
            return type + " - " + title + " (Unidad " + unit + ")";
        }
        return type + " - " + title;
    }
}
```

---

### Task 6: Update ChatService

**Files:**
- Modify: `backend/src/main/java/com/matematica/chat/service/ChatService.java`

- [ ] **Step 1: Pass webSearchEnabled through ChatService**

Update `sendMessage` method to use the new constructor:

```java
var ragResponse = ragService.query(new RagQueryRequest(request.message(), request.webSearchEnabled()));
```

And update the ChatResponse construction:

```java
return new ChatResponse(
        assistantMessage.getId(),
        session.getId(),
        ragResponse.answer(),
        ragResponse.sources(),
        ragResponse.webSources(),
        assistantMessage.getCreatedAt()
);
```

---

### Task 7: Update Frontend ApiService

**Files:**
- Modify: `frontend/src/app/core/services/api.service.ts`

- [ ] **Step 1: Update DTOs in api.service.ts**

```typescript
export interface ChatRequest { sessionId?: string; message: string; webSearchEnabled?: boolean; }
export interface ChatResponse { messageId: string; sessionId: string; answer: string; sources: string; webSources: string; timestamp: string; }
```

---

### Task 8: Update ChatComponent with Web Search Toggle

**Files:**
- Modify: `frontend/src/app/modules/chat/chat.component.ts`

- [ ] **Step 1: Add MatSlideToggleModule import and webSearchEnabled signal**

Add to imports: `MatSlideToggleModule` from `@angular/material/slide-toggle`

Add signal: `webSearchEnabled = signal(false);`

- [ ] **Step 2: Add toggle to template**

Add before the input area:

```html
<div class="search-toggle">
  <mat-slide-toggle [checked]="webSearchEnabled()" (change)="webSearchEnabled.set(!webSearchEnabled())">
    Buscar en la web
  </mat-slide-toggle>
</div>
```

- [ ] **Step 3: Update sendMessage to pass webSearchEnabled**

```typescript
this.api.sendMessage({
  sessionId: this.sessionId ?? undefined,
  message: text,
  webSearchEnabled: this.webSearchEnabled()
})
```

- [ ] **Step 4: Update Message interface to include webSources**

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string;
  webSources?: string;
}
```

- [ ] **Step 5: Update message display to show web sources**

After the existing sources block, add:

```html
<div class="sources web-sources" *ngIf="msg.webSources">
  <strong>Fuentes Web:</strong><br>
  <span *ngFor="let ws of parseWebSources(msg.webSources)" class="web-source-item">
    <mat-icon class="web-icon">language</mat-icon>
    <a [href]="ws.url" target="_blank" rel="noopener">{{ ws.title }}</a>
  </span>
</div>
```

- [ ] **Step 6: Add parseWebSources method**

```typescript
parseWebSources(webSources: string): { title: string; url: string }[] {
  if (!webSources) return [];
  return webSources.split('\n').filter(l => l.trim()).map(line => {
    const match = line.match(/\[Web \d+\]\s+(.+?)\s+-\s+(.+)/);
    return match ? { title: match[1], url: match[2] } : { title: line, url: '' };
  });
}
```

- [ ] **Step 7: Update next handler to include webSources**

```typescript
this.messages.update(m => [...m, {
  role: 'assistant',
  content: res.answer,
  sources: res.sources,
  webSources: res.webSources
}]);
```

- [ ] **Step 8: Add styles for web sources**

```css
.search-toggle { padding: 0.5rem 1rem; display: flex; align-items: center; }
.web-sources { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e0e0e0; }
.web-source-item { display: flex; align-items: center; gap: 0.25rem; margin: 0.25rem 0; }
.web-icon { font-size: 16px; width: 16px; height: 16px; color: #1976d2; }
.web-source-item a { color: #1976d2; text-decoration: none; font-size: 0.875rem; }
.web-source-item a:hover { text-decoration: underline; }
```

---

### Task 9: Compile and Verify

- [ ] **Step 1: Backend compilation**

Run: `cd /home/proyecto/matematica/backend && mvn compile -q 2>&1 | tail -10`
Expected: BUILD SUCCESS

- [ ] **Step 2: Frontend build check**

Run: `cd /home/proyecto/matematica/frontend && npx ng build 2>&1 | tail -10`
Expected: Build successful (or just type-check errors if Angular CLI not fully set up)

---

### Task 10: Write Feature Report

- [ ] **Step 1: Write report to /tmp/feature2-report.md**

Summary of all changes made, configuration needed, and usage instructions.
