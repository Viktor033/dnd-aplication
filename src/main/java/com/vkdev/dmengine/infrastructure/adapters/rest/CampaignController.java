package com.vkdev.dmengine.infrastructure.adapters.rest;

import com.vkdev.dmengine.core.ports.AiProvider;
import com.vkdev.dmengine.core.domain.UserEntity;
import com.vkdev.dmengine.core.domain.SubscriptionTier;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${dmengine.ai.provider:mock}")
    private String aiProviderType;

    public CampaignController(AiProvider aiProvider) {
        this.aiProvider = aiProvider;
    }

    private UserEntity getAuthenticatedUser() {
        org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserEntity) {
            return (UserEntity) auth.getPrincipal();
        }
        throw new org.springframework.security.access.AccessDeniedException("Acceso denegado: Usuario no autenticado");
    }

    private void checkAiAccess() {
        // El proveedor mock es libre para pruebas en plan Aventurero,
        // pero el proveedor real (anthropic) requiere suscripción Dungeon Master o Leyenda.
        if ("anthropic".equalsIgnoreCase(aiProviderType)) {
            UserEntity user = getAuthenticatedUser();
            if (user.getSubscriptionTier() == SubscriptionTier.AVENTURERO) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "El plan Aventurero no incluye acceso a la IA real de Claude. ¡Sube de nivel tu plan!");
            }
        }
    }

    /**
     * GET /api/campaign/generate-room?context=una mazmorra oscura
     * Genera una descripción narrativa de una sala o escena usando IA.
     */
    @GetMapping("/generate-room")
    public ResponseEntity<Map<String, String>> generateRoom(
            @RequestParam(defaultValue = "una mazmorra oscura y misteriosa") String context) {
        checkAiAccess();
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
        checkAiAccess();
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
        checkAiAccess();
        String role = body.getOrDefault("role", "personaje misterioso");
        String location = body.getOrDefault("location", "una taberna");
        String prompt = "Crea un NPC de D&D con el rol de " + role + " en " + location + ". Incluye nombre, apariencia, personalidad y un secreto.";
        String narrative = aiProvider.generateNarrative(prompt);
        return ResponseEntity.ok(Map.of("narrative", narrative));
    }
}
