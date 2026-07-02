package com.vkdev.dmengine.infrastructure.adapters.rest;

import com.vkdev.dmengine.core.domain.CampaignEntity;
import com.vkdev.dmengine.core.domain.CampaignService;
import com.vkdev.dmengine.core.domain.CampaignStatus;
import com.vkdev.dmengine.core.domain.SessionEntity;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador REST para Campañas y Sesiones.
 *
 * NOTA: Este controller maneja /api/campaigns (CRUD de campañas y sesiones).
 * El controller existente CampaignController maneja /api/campaign (IA generativa).
 * No hay conflicto de rutas.
 *
 * Todos los endpoints requieren autenticación JWT (configurado en SecurityConfig).
 * El aislamiento multi-tenant (filtrado por usuario) lo hace CampaignService internamente.
 */
@RestController
@RequestMapping("/api/campaigns")
@CrossOrigin(origins = "*")
public class CampaignCrudController {

    private final CampaignService campaignService;

    public CampaignCrudController(CampaignService campaignService) {
        this.campaignService = campaignService;
    }

    // ==========================================
    // CAMPAÑAS
    // ==========================================

    /**
     * GET /api/campaigns
     * Devuelve todas las campañas del usuario autenticado, con totalSessions calculado.
     */
    @GetMapping
    public ResponseEntity<List<CampaignEntity>> getAll() {
        return ResponseEntity.ok(campaignService.findAll());
    }

    /**
     * GET /api/campaigns/{id}
     * Devuelve una campaña por ID (solo si pertenece al usuario autenticado).
     */
    @GetMapping("/{id}")
    public ResponseEntity<CampaignEntity> getById(@PathVariable Long id) {
        return ResponseEntity.ok(campaignService.findById(id));
    }

    /**
     * POST /api/campaigns
     * Crea una nueva campaña para el usuario autenticado.
     * Body: { "name": "...", "system": "D&D 5e", "setting": "...", "playerCount": 4 }
     */
    @PostMapping
    public ResponseEntity<CampaignEntity> create(@Valid @RequestBody CampaignEntity campaign) {
        return ResponseEntity.status(HttpStatus.CREATED).body(campaignService.create(campaign));
    }

    /**
     * PUT /api/campaigns/{id}
     * Actualiza todos los campos de una campaña.
     */
    @PutMapping("/{id}")
    public ResponseEntity<CampaignEntity> update(@PathVariable Long id,
                                                  @Valid @RequestBody CampaignEntity campaign) {
        return ResponseEntity.ok(campaignService.update(id, campaign));
    }

    /**
     * PATCH /api/campaigns/{id}/status
     * Cambia solo el estado de la campaña: ACTIVE, PAUSED o COMPLETED.
     * Body: { "status": "PAUSED" }
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<CampaignEntity> changeStatus(@PathVariable Long id,
                                                        @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().build();
        }
        try {
            CampaignStatus newStatus = CampaignStatus.valueOf(statusStr.toUpperCase());
            return ResponseEntity.ok(campaignService.changeStatus(id, newStatus));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * DELETE /api/campaigns/{id}
     * Elimina una campaña y todas sus sesiones (cascade).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        campaignService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // SESIONES (sub-recurso de campaña)
    // ==========================================

    /**
     * GET /api/campaigns/{id}/sessions
     * Devuelve el historial de sesiones de una campaña, ordenado por número de sesión desc.
     */
    @GetMapping("/{id}/sessions")
    public ResponseEntity<List<SessionEntity>> getSessions(@PathVariable Long id) {
        return ResponseEntity.ok(campaignService.findSessionsByCampaign(id));
    }

    /**
     * POST /api/campaigns/{id}/sessions
     * Registra una nueva sesión en una campaña. El sessionNumber se auto-incrementa.
     * Body: { "title": "...", "summary": "...", "durationMinutes": 180,
     *         "combatCount": 2, "enemiesDefeated": 5, "tags": "COMBAT,ROLEPLAY" }
     */
    @PostMapping("/{id}/sessions")
    public ResponseEntity<SessionEntity> createSession(@PathVariable Long id,
                                                        @Valid @RequestBody SessionEntity session) {
        return ResponseEntity.status(HttpStatus.CREATED).body(campaignService.createSession(id, session));
    }

    /**
     * PUT /api/campaigns/{id}/sessions/{sessionId}
     * Actualiza los datos de una sesión existente.
     */
    @PutMapping("/{id}/sessions/{sessionId}")
    public ResponseEntity<SessionEntity> updateSession(@PathVariable Long id,
                                                        @PathVariable Long sessionId,
                                                        @Valid @RequestBody SessionEntity session) {
        return ResponseEntity.ok(campaignService.updateSession(id, sessionId, session));
    }

    /**
     * DELETE /api/campaigns/{id}/sessions/{sessionId}
     * Elimina una sesión del historial.
     */
    @DeleteMapping("/{id}/sessions/{sessionId}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id,
                                               @PathVariable Long sessionId) {
        campaignService.deleteSession(id, sessionId);
        return ResponseEntity.noContent().build();
    }
}
