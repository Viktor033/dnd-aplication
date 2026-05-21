package com.vkdev.dmengine.infrastructure.adapters.rest;

import com.vkdev.dmengine.core.domain.CharacterEntity;
import com.vkdev.dmengine.core.domain.CharacterService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador REST para la gestión de personajes (Héroes, Monstruos, NPCs).
 * Delega toda la lógica al CharacterService.
 */
@RestController
@RequestMapping("/api/characters")
@CrossOrigin(origins = "*")
public class CharacterController {

    private final CharacterService characterService;

    public CharacterController(CharacterService characterService) {
        this.characterService = characterService;
    }

    // GET /api/characters — todos los personajes
    @GetMapping
    public ResponseEntity<List<CharacterEntity>> getAll() {
        return ResponseEntity.ok(characterService.findAll());
    }

    // GET /api/characters?type=HEROE — filtrar por tipo
    @GetMapping(params = "type")
    public ResponseEntity<List<CharacterEntity>> getByType(@RequestParam String type) {
        return ResponseEntity.ok(characterService.findByType(type));
    }

    // GET /api/characters/{id}
    @GetMapping("/{id}")
    public ResponseEntity<CharacterEntity> getById(@PathVariable Long id) {
        return ResponseEntity.ok(characterService.findById(id));
    }

    // POST /api/characters — crear personaje
    @PostMapping
    public ResponseEntity<CharacterEntity> create(@Valid @RequestBody CharacterEntity character) {
        return ResponseEntity.status(HttpStatus.CREATED).body(characterService.save(character));
    }

    // PUT /api/characters/{id} — actualizar personaje completo
    @PutMapping("/{id}")
    public ResponseEntity<CharacterEntity> update(@PathVariable Long id,
                                                   @Valid @RequestBody CharacterEntity character) {
        return ResponseEntity.ok(characterService.update(id, character));
    }

    // PATCH /api/characters/{id}/toggle-death — alternar estado de muerte
    @PatchMapping("/{id}/toggle-death")
    public ResponseEntity<CharacterEntity> toggleDeath(@PathVariable Long id) {
        return ResponseEntity.ok(characterService.toggleDeath(id));
    }

    // PATCH /api/characters/{id}/hp — aplicar daño o curación
    // Body: { "delta": -5 } para daño, { "delta": 3 } para curación
    @PatchMapping("/{id}/hp")
    public ResponseEntity<CharacterEntity> updateHp(@PathVariable Long id,
                                                     @RequestBody Map<String, Integer> body) {
        int delta = body.getOrDefault("delta", 0);
        return ResponseEntity.ok(characterService.applyHpChange(id, delta));
    }

    // DELETE /api/characters/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        characterService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // DELETE /api/characters/purge-dead — eliminar todos los muertos
    @DeleteMapping("/purge-dead")
    public ResponseEntity<Map<String, Object>> purgeDead() {
        int count = characterService.purgeDeadCharacters();
        return ResponseEntity.ok(Map.of("deleted", count, "message", count + " personajes purgados"));
    }
}
