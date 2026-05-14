package com.vkdev.dmengine.core.ports;

import com.vkdev.dmengine.core.domain.CharacterEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CharacterRepository extends JpaRepository<CharacterEntity, Long> {
    // Esta interfaz hereda todos los métodos para guardar, borrar y buscar.
}