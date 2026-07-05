package com.matematica.settings.repository;

import com.matematica.settings.domain.AppSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface AppSettingRepository extends JpaRepository<AppSetting, UUID> {
    Optional<AppSetting> findByKey(String key);
}
