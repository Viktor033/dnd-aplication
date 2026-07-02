package com.vkdev.dmengine.core.ports;

import com.vkdev.dmengine.core.domain.CampaignEntity;
import com.vkdev.dmengine.core.domain.SessionEntity;
import com.vkdev.dmengine.core.domain.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Puerto de repositorio para Sesión de juego.
 */
@Repository
public interface SessionRepository extends JpaRepository<SessionEntity, Long> {

    /** Todas las sesiones de una campaña, ordenadas por número de sesión desc (más reciente primero). */
    List<SessionEntity> findByCampaignOrderBySessionNumberDesc(CampaignEntity campaign);

    /** Sesiones de una campaña filtradas por estado (devuelve lista). */
    List<SessionEntity> findByCampaignAndStatus(CampaignEntity campaign, SessionStatus status);

    /** Número máximo de sesión en una campaña (para auto-incrementar el número). */
    Optional<SessionEntity> findTopByCampaignOrderBySessionNumberDesc(CampaignEntity campaign);

    /** Todas las sesiones por campaña (sin orden específico). */
    List<SessionEntity> findByCampaign(CampaignEntity campaign);
}
