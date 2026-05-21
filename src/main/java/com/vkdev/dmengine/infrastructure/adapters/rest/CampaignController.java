package com.vkdev.dmengine.infrastructure.adapters.rest;

import com.vkdev.dmengine.core.ports.AiProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador REST para funcionalidades de campaña.
 * Maneja la generación de narrativa con IA.
 * CORREGIDO: ya no duplica los endpoints de /characters.
 */
@RestController
@RequestMapping("/api/campaign")
@CrossOrigin(origins = "*")
public class CampaignController {

    private final AiProvider aiProvider;

    public CampaignController(AiProvider aiProvider) {
        this.aiProvider = aiProvider;
    }

    /**
     * GET /api/campaign/generate-room?context=una mazmorra oscura
     * Genera una descripción narrativa de una sala o escena usando IA.
     */
    @GetMapping("/generate-room")
    public ResponseEntity<Map<String, String>> generateRoom(
            @RequestParam(defaultValue = "una mazmorra oscura y misteriosa") String context) {
        String narrative = aiProvider.generateNarrative(context);
        return ResponseEntity.ok(Map.of("narrative", narrative, "context", context));
    }

    /**
     * POST /api/campaign/generate-encounter
     * Body: { "party": "3 héroes nivel 5", "location": "bosque encantado" }
     * Genera una descripción de encuentro personalizada.
     */
    @PostMapping("/generate-encounter")
    public ResponseEntity<Map<String, String>> generateEncounter(@RequestBody Map<String, String> body) {
        String party = body.getOrDefault("party", "un grupo de aventureros");
        String location = body.getOrDefault("location", "una mazmorra");
        String prompt = "Genera un encuentro de combate para " + party + " en " + location + ". Describe el escenario, los enemigos y la atmósfera.";
        String narrative = aiProvider.generateNarrative(prompt);
        return ResponseEntity.ok(Map.of("narrative", narrative));
    }

    /**
     * POST /api/campaign/generate-npc
     * Body: { "role": "tabernero", "location": "ciudad portuaria" }
     * Genera la descripción y personalidad de un NPC.
     */
    @PostMapping("/generate-npc")
    public ResponseEntity<Map<String, String>> generateNpc(@RequestBody Map<String, String> body) {
        String role = body.getOrDefault("role", "personaje misterioso");
        String location = body.getOrDefault("location", "una taberna");
        String prompt = "Crea un NPC de D&D con el rol de " + role + " en " + location + ". Incluye nombre, apariencia, personalidad y un secreto.";
        String narrative = aiProvider.generateNarrative(prompt);
        return ResponseEntity.ok(Map.of("narrative", narrative));
    }
}
