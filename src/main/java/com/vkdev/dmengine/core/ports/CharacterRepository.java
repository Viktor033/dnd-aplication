package com.vkdev.dmengine.core.ports;

import com.vkdev.dmengine.core.domain.CharacterEntity;
import com.vkdev.dmengine.core.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CharacterRepository extends JpaRepository<CharacterEntity, Long> {

    // Buscar por tipo: HEROE, MONSTRUO, NPC
    List<CharacterEntity> findByType(String type);

    // Buscar personajes muertos (para el purgado)
    List<CharacterEntity> findByIsDead(Boolean isDead);

    // --- Métodos SaaS para filtrado por usuario ---
    List<CharacterEntity> findByUser(UserEntity user);
    List<CharacterEntity> findByUserAndType(UserEntity user, String type);
    List<CharacterEntity> findByUserAndIsDead(UserEntity user, Boolean isDead);
    long countByUserAndIsDead(UserEntity user, Boolean isDead);
}