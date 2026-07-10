package com.matematica.documents.service;

import com.matematica.documents.domain.DocumentType;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.pdf.PDFParser;
import org.apache.tika.sax.ToTextContentHandler;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

@Service
@Slf4j
public class DocumentParser {

    private final Tika tika = new Tika();

    public ParsedDocument parse(MultipartFile file, DocumentType type) {
        try (var input = file.getInputStream()) {
            return switch (type) {
                case PDF -> parsePdf(input);
                case DOCX, PPTX, TXT, MARKDOWN -> parseWithAutoDetect(input);
                case YOUTUBE_VIDEO -> new ParsedDocument("", null, null, null);
            };
        } catch (Exception e) {
            log.error("Error parsing document: {}", file.getOriginalFilename(), e);
            return new ParsedDocument("", null, null, null);
        }
    }

    private ParsedDocument parsePdf(InputStream input) throws Exception {
        var metadata = new Metadata();
        var handler = new ToTextContentHandler();
        var parser = new PDFParser();
        parser.parse(input, handler, metadata, new ParseContext());

        String author = metadata.get("dc:creator");
        String title = metadata.get("dc:title");
        String pageCountStr = metadata.get("xmpTPg:NPages");
        Integer pageCount = pageCountStr != null ? Integer.parseInt(pageCountStr) : null;

        return new ParsedDocument(handler.toString(), author, title, pageCount);
    }

    private ParsedDocument parseWithAutoDetect(InputStream input) throws Exception {
        var metadata = new Metadata();
        var handler = new ToTextContentHandler();
        var parser = new AutoDetectParser();
        parser.parse(input, handler, metadata, new ParseContext());

        String author = metadata.get("dc:creator");
        String title = metadata.get("dc:title");

        return new ParsedDocument(handler.toString(), author, title, null);
    }

    public String detectMimeType(byte[] prefix) {
        return tika.detect(prefix);
    }

    public record ParsedDocument(String text, String author, String title, Integer pageCount) {}
}
