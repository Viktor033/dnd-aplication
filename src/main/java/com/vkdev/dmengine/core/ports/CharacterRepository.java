package com.vkdev.dmengine.core.ports;

import com.vkdev.dmengine.core.domain.CharacterEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CharacterRepository extends JpaRepository<CharacterEntity, Long> {

    // Buscar por tipo: HEROE, MONSTRUO, NPC
    List<CharacterEntity> findByType(String type);

    // Buscar personajes muertos (para el purgado)
    List<CharacterEntity> findByIsDead(Boolean isDead);
}