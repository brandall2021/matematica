package com.matematica.settings.service;

import com.matematica.settings.domain.AppSetting;
import com.matematica.settings.dto.SettingRequest;
import com.matematica.settings.dto.SettingResponse;
import com.matematica.settings.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SettingService {

    private final AppSettingRepository settingRepository;

    public List<SettingResponse> getAll() {
        return settingRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public SettingResponse getByKey(String key) {
        return settingRepository.findByKey(key)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Setting not found: " + key));
    }

    @Transactional
    public SettingResponse update(String key, SettingRequest request, UUID userId) {
        var setting = settingRepository.findByKey(key)
                .orElseGet(() -> AppSetting.builder()
                        .key(request.key())
                        .build());
        setting.setValue(request.value());
        setting.setDescription(request.description());
        setting.setUpdatedBy(userId);
        setting = settingRepository.save(setting);
        return toResponse(setting);
    }
}
