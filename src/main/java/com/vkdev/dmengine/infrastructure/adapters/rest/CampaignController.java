package com.vkdev.dmengine.infrastructure.adapters.rest;

import com.vkdev.dmengine.core.domain.CharacterEntity;
import com.vkdev.dmengine.core.ports.AiProvider;
import com.vkdev.dmengine.core.ports.CharacterRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class CampaignController {

    private final AiProvider aiProvider;
    private final CharacterRepository characterRepository;

    public CampaignController(AiProvider aiProvider, CharacterRepository characterRepository) {
        this.aiProvider = aiProvider;
        this.characterRepository = characterRepository;
    }

    // Endpoint para la IA
    @GetMapping("/generate-room")
    public String generateRoom(@RequestParam(defaultValue = "una mazmorra") String context) {
        return aiProvider.generateNarrative(context);
    }

    // --- MÉTODOS PARA PERSONAJES ---

    // Guardar o actualizar un personaje
    @PostMapping("/characters")
    public CharacterEntity createCharacter(@RequestBody CharacterEntity character) {
        return characterRepository.save(character);
    }

    // Listar todos los personajes (Monstruos, Jugadores y NPCs)
    @GetMapping("/characters")
    public List<CharacterEntity> getAllCharacters() {
        return characterRepository.findAll();
    }

    // NUEVO: Eliminar un personaje por ID
    @DeleteMapping("/characters/{id}")
    public void deleteCharacter(@PathVariable Long id) {
        characterRepository.deleteById(id);
    }
}