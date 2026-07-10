package com.matematica.settings.controller;

import com.matematica.settings.dto.SettingRequest;
import com.matematica.settings.dto.SettingResponse;
import com.matematica.settings.service.SettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingController {

    private final SettingService settingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<SettingResponse>> getAll() {
        return ResponseEntity.ok(settingService.getAll());
    }

    @GetMapping("/{key}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<SettingResponse> getByKey(@PathVariable String key) {
        return ResponseEntity.ok(settingService.getByKey(key));
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SettingResponse> update(
            @PathVariable String key,
            @Valid @RequestBody SettingRequest request,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(settingService.update(key, request, userId));
    }
}
