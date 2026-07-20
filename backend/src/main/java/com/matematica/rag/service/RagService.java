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
