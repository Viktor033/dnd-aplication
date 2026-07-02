package com.vkdev.dmengine.core.domain;

import com.vkdev.dmengine.core.ports.CampaignRepository;
import com.vkdev.dmengine.core.ports.SessionRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Capa de servicio para Campaña y Sesión.
 *
 * Responsabilidades:
 * - CRUD de campañas (con aislamiento por usuario — multi-tenant SaaS)
 * - Límite de campañas activas por tier (Aventurero: máx 2, DM Pro/Leyenda: ilimitadas)
 * - CRUD de sesiones (pertenecen a una campaña del mismo usuario)
 * - Actualización automática de lastPlayedAt y totalSessions en la campaña
 * - Auto-incremento del sessionNumber al crear sesiones
 */
@Service
@Transactional
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final SessionRepository  sessionRepository;

    /** Límite de campañas ACTIVE para el tier Aventurero. */
    private static final int AVENTURERO_CAMPAIGN_LIMIT = 2;

    public CampaignService(CampaignRepository campaignRepository,
                           SessionRepository sessionRepository) {
        this.campaignRepository = campaignRepository;
        this.sessionRepository  = sessionRepository;
    }

    // ==========================================
    // AUXILIARES
    // ==========================================

    private UserEntity getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserEntity u) {
            return u;
        }
        throw new RuntimeException("Acceso denegado: usuario no autenticado");
    }

    /**
     * Enriquece una campaña con el campo calculado totalSessions.
     * No es costoso porque es una COUNT en la DB, no un fetch completo de sesiones.
     */
    private CampaignEntity enrich(CampaignEntity campaign) {
        long count = campaignRepository.countSessionsByCampaignId(campaign.getId());
        campaign.setTotalSessions((int) count);
        return campaign;
    }

    // ==========================================
    // CAMPAÑAS — CRUD
    // ==========================================

    /**
     * Devuelve todas las campañas del usuario autenticado, ordenadas por última sesión.
     * Incluye totalSessions calculado.
     */
    @Transactional(readOnly = true)
    public List<CampaignEntity> findAll() {
        UserEntity user = getAuthenticatedUser();
        return campaignRepository.findByOwnerOrderByLastPlayedAtDesc(user)
                .stream().map(this::enrich).toList();
    }

    /**
     * Devuelve una campaña por ID, validando que pertenezca al usuario autenticado.
     */
    @Transactional(readOnly = true)
    public CampaignEntity findById(Long id) {
        CampaignEntity campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaña con id " + id + " no encontrada"));
        validateOwnership(campaign);
        return enrich(campaign);
    }

    /**
     * Crea una nueva campaña para el usuario autenticado.
     * Aplica límite SaaS para tier Aventurero (máx 2 campañas ACTIVE).
     */
    public CampaignEntity create(CampaignEntity campaign) {
        UserEntity user = getAuthenticatedUser();

        // Enforce SaaS limit for AVENTURERO tier
        if (user.getSubscriptionTier() == SubscriptionTier.AVENTURERO) {
            long activeCount = campaignRepository.countByOwnerAndStatus(user, CampaignStatus.ACTIVE);
            if (activeCount >= AVENTURERO_CAMPAIGN_LIMIT) {
                throw new RuntimeException(
                    "Límite excedido: El plan Aventurero permite hasta " + AVENTURERO_CAMPAIGN_LIMIT +
                    " campañas activas. ¡Sube de nivel tu suscripción!");
            }
        }

        campaign.setOwner(user);
        if (campaign.getStatus() == null) campaign.setStatus(CampaignStatus.ACTIVE);
        if (campaign.getArcProgress() == null) campaign.setArcProgress(0);

        return enrich(campaignRepository.save(campaign));
    }

    /**
     * Actualiza los datos de una campaña (solo el dueño puede modificarla).
     */
    public CampaignEntity update(Long id, CampaignEntity updated) {
        CampaignEntity existing = findById(id); // valida ownership

        existing.setName(updated.getName());
        existing.setSystem(updated.getSystem());
        existing.setSetting(updated.getSetting());
        existing.setCurrentArc(updated.getCurrentArc());
        existing.setArcProgress(updated.getArcProgress());
        existing.setPlayerCount(updated.getPlayerCount());
        existing.setDmNotes(updated.getDmNotes());

        // Solo actualizar status si se provee (para no borrar accidentalmente)
        if (updated.getStatus() != null) {
            existing.setStatus(updated.getStatus());
        }

        return enrich(campaignRepository.save(existing));
    }

    /**
     * Cambia solo el estado de una campaña (ACTIVE ↔ PAUSED ↔ COMPLETED).
     */
    public CampaignEntity changeStatus(Long id, CampaignStatus newStatus) {
        CampaignEntity campaign = findById(id);

        // Aplicar límite SaaS si se intenta activar una campaña (Aventurero)
        if (newStatus == CampaignStatus.ACTIVE &&
            campaign.getStatus() != CampaignStatus.ACTIVE) {
            UserEntity user = getAuthenticatedUser();
            if (user.getSubscriptionTier() == SubscriptionTier.AVENTURERO) {
                long activeCount = campaignRepository.countByOwnerAndStatus(user, CampaignStatus.ACTIVE);
                if (activeCount >= AVENTURERO_CAMPAIGN_LIMIT) {
                    throw new RuntimeException(
                        "Límite excedido: El plan Aventurero permite hasta " + AVENTURERO_CAMPAIGN_LIMIT +
                        " campañas activas simultáneamente.");
                }
            }
        }

        campaign.setStatus(newStatus);
        return enrich(campaignRepository.save(campaign));
    }

    /**
     * Elimina una campaña junto con todas sus sesiones (cascade ALL en la relación).
     */
    public void delete(Long id) {
        CampaignEntity campaign = findById(id);
        campaignRepository.delete(campaign);
    }

    // ==========================================
    // SESIONES — CRUD
    // ==========================================

    /**
     * Devuelve todas las sesiones de una campaña, ordenadas por número de sesión desc.
     */
    @Transactional(readOnly = true)
    public List<SessionEntity> findSessionsByCampaign(Long campaignId) {
        CampaignEntity campaign = findById(campaignId);
        return sessionRepository.findByCampaignOrderBySessionNumberDesc(campaign);
    }

    /**
     * Crea una nueva sesión en una campaña.
     * Auto-incrementa el sessionNumber tomando el máximo existente + 1.
     * Si status = IN_PROGRESS, actualiza lastPlayedAt de la campaña.
     */
    public SessionEntity createSession(Long campaignId, SessionEntity session) {
        CampaignEntity campaign = findById(campaignId);

        // Auto-increment session number
        int nextNumber = sessionRepository
                .findTopByCampaignOrderBySessionNumberDesc(campaign)
                .map(s -> s.getSessionNumber() + 1)
                .orElse(1);

        session.setSessionNumber(nextNumber);
        session.setCampaign(campaign);

        if (session.getStatus() == null) session.setStatus(SessionStatus.COMPLETED);
        if (session.getPlayedAt() == null) session.setPlayedAt(LocalDateTime.now());

        SessionEntity saved = sessionRepository.save(session);

        // Actualizar lastPlayedAt de la campaña con la fecha de esta sesión
        campaign.setLastPlayedAt(session.getPlayedAt());
        campaignRepository.save(campaign);

        return saved;
    }

    /**
     * Actualiza los datos de una sesión (valida que la campaña sea del usuario).
     */
    public SessionEntity updateSession(Long campaignId, Long sessionId, SessionEntity updated) {
        // Validar que la campaña pertenece al usuario
        findById(campaignId);

        SessionEntity existing = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Sesión con id " + sessionId + " no encontrada"));

        // Validar que la sesión pertenece a esa campaña
        if (!existing.getCampaign().getId().equals(campaignId)) {
            throw new RuntimeException("La sesión " + sessionId + " no pertenece a la campaña " + campaignId);
        }

        existing.setTitle(updated.getTitle());
        existing.setSummary(updated.getSummary());
        existing.setStatus(updated.getStatus());
        existing.setDurationMinutes(updated.getDurationMinutes());
        existing.setCombatCount(updated.getCombatCount());
        existing.setEnemiesDefeated(updated.getEnemiesDefeated());
        existing.setNpcCount(updated.getNpcCount());
        existing.setTags(updated.getTags());
        if (updated.getPlayedAt() != null) existing.setPlayedAt(updated.getPlayedAt());

        return sessionRepository.save(existing);
    }

    /**
     * Elimina una sesión (valida que la campaña sea del usuario).
     */
    public void deleteSession(Long campaignId, Long sessionId) {
        // Validar que la campaña pertenece al usuario
        CampaignEntity campaign = findById(campaignId);

        SessionEntity session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Sesión con id " + sessionId + " no encontrada"));

        if (!session.getCampaign().getId().equals(campaignId)) {
            throw new RuntimeException("La sesión " + sessionId + " no pertenece a la campaña " + campaignId);
        }

        sessionRepository.delete(session);
    }

    // ==========================================
    // PRIVADOS
    // ==========================================

    private void validateOwnership(CampaignEntity campaign) {
        UserEntity user = getAuthenticatedUser();
        if (campaign.getOwner() == null || !campaign.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Acceso denegado: esta campaña no te pertenece");
        }
    }
}
