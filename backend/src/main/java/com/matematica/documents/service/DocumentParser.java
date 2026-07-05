package com.matematica.documents.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.pdf.PDFParser;
import org.apache.tika.sax.ToTextContentHandler;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@Slf4j
public class DocumentParser {

    public ParsedDocument parse(MultipartFile file) {
        try (var input = file.getInputStream()) {
            var metadata = new Metadata();
            var handler = new ToTextContentHandler();
            var parser = new PDFParser();
            parser.parse(input, handler, metadata, new ParseContext());

            String author = metadata.get(Metadata.AUTHOR);
            String title = metadata.get(Metadata.TITLE);
            String pageCountStr = metadata.get("xmpTPg:NPages");
            Integer pageCount = pageCountStr != null ? Integer.parseInt(pageCountStr) : null;

            return new ParsedDocument(handler.toString(), author, title, pageCount);
        } catch (Exception e) {
            log.error("Error parsing document: {}", file.getOriginalFilename(), e);
            return new ParsedDocument("", null, null, null);
        }
    }

    public record ParsedDocument(String text, String author, String title, Integer pageCount) {}
}
