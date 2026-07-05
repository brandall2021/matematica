package com.matematica.documents.repository;

import com.matematica.documents.domain.Document;
import com.matematica.documents.domain.DocumentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    Page<Document> findBySubject(String subject, Pageable pageable);

    Page<Document> findByUnit(String unit, Pageable pageable);

    @Query("SELECT d FROM Document d WHERE " +
           "LOWER(d.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(d.author) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(d.tags) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Document> search(@Param("q") String query, Pageable pageable);

    List<Document> findByIndexedFalse();

    long countByIndexedTrue();

    long countByType(DocumentType type);

    @Query("SELECT d.subject, COUNT(d) FROM Document d GROUP BY d.subject ORDER BY COUNT(d) DESC")
    List<Object[]> countBySubject();
}
