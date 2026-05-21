package com.vkdev.dmengine.core.domain;

import com.vkdev.dmengine.core.ports.CharacterRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Capa de servicio para la lógica de negocio de personajes.
 * Actúa como intermediario entre los controladores y el repositorio,
 * respetando la arquitectura hexagonal del proyecto.
 */
@Service
public class CharacterService {

    private final CharacterRepository characterRepository;

    public CharacterService(CharacterRepository characterRepository) {
        this.characterRepository = characterRepository;
    }

    public List<CharacterEntity> findAll() {
        return characterRepository.findAll();
    }

    public List<CharacterEntity> findByType(String type) {
        return characterRepository.findByType(type);
    }

    public CharacterEntity findById(Long id) {
        return characterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Personaje con id " + id + " no encontrado"));
    }

    public CharacterEntity save(CharacterEntity character) {
        // Si no tiene isDead seteado, inicializarlo en false
        if (character.getIsDead() == null) {
            character.setIsDead(false);
        }
        // Sincronizar maxHp y currentHp con hp si vienen del frontend
        if (character.getHp() != null) {
            if (character.getMaxHp() == null) character.setMaxHp(character.getHp());
            if (character.getCurrentHp() == null) character.setCurrentHp(character.getHp());
        }
        return characterRepository.save(character);
    }

    public CharacterEntity update(Long id, CharacterEntity updated) {
        CharacterEntity existing = findById(id);
        existing.setName(updated.getName());
        existing.setType(updated.getType());
        existing.setRace(updated.getRace());
        existing.setGender(updated.getGender());
        existing.setCharClass(updated.getCharClass());
        existing.setBackground(updated.getBackground());
        existing.setAlignment(updated.getAlignment());
        existing.setStatus(updated.getStatus());
        existing.setLevel(updated.getLevel());
        existing.setHp(updated.getHp());
        if (updated.getMaxHp() != null) existing.setMaxHp(updated.getMaxHp());
        if (updated.getCurrentHp() != null) existing.setCurrentHp(updated.getCurrentHp());
        existing.setStr(updated.getStr());
        existing.setDex(updated.getDex());
        existing.setCon(updated.getCon());
        existing.setIntel(updated.getIntel());
        existing.setWis(updated.getWis());
        existing.setCha(updated.getCha());
        existing.setDescription(updated.getDescription());
        return characterRepository.save(existing);
    }

    /**
     * Alterna el estado de muerte de un personaje.
     */
    public CharacterEntity toggleDeath(Long id) {
        CharacterEntity character = findById(id);
        character.setIsDead(!Boolean.TRUE.equals(character.getIsDead()));
        if (Boolean.TRUE.equals(character.getIsDead())) {
            character.setCurrentHp(0);
        }
        return characterRepository.save(character);
    }

    /**
     * Aplica daño o curación al HP actual de un personaje.
     * Valor positivo = curación, negativo = daño.
     */
    public CharacterEntity applyHpChange(Long id, int delta) {
        CharacterEntity character = findById(id);
        int newHp = (character.getCurrentHp() != null ? character.getCurrentHp() : 0) + delta;
        newHp = Math.max(0, Math.min(newHp, character.getMaxHp() != null ? character.getMaxHp() : newHp));
        character.setCurrentHp(newHp);
        if (newHp == 0) character.setIsDead(true);
        return characterRepository.save(character);
    }

    public void deleteById(Long id) {
        if (!characterRepository.existsById(id)) {
            throw new RuntimeException("Personaje con id " + id + " no encontrado");
        }
        characterRepository.deleteById(id);
    }

    /**
     * Elimina todos los personajes marcados como muertos.
     */
    public int purgeDeadCharacters() {
        List<CharacterEntity> dead = characterRepository.findByIsDead(true);
        characterRepository.deleteAll(dead);
        return dead.size();
    }
}
