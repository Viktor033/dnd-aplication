package com.vkdev.dmengine.core.ports;

import com.vkdev.dmengine.core.domain.CampaignEntity;
import com.vkdev.dmengine.core.domain.CampaignStatus;
import com.vkdev.dmengine.core.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Puerto de repositorio para Campaña.
 * Spring Data JPA genera la implementación en tiempo de arranque.
 */
@Repository
public interface CampaignRepository extends JpaRepository<CampaignEntity, Long> {

    /** Todas las campañas de un usuario, ordenadas por última sesión desc. */
    List<CampaignEntity> findByOwnerOrderByLastPlayedAtDesc(UserEntity owner);

    /** Campañas de un usuario filtradas por estado. */
    List<CampaignEntity> findByOwnerAndStatus(UserEntity owner, CampaignStatus status);

    /** Cuántas campañas activas tiene un usuario (para límite SaaS). */
    long countByOwnerAndStatus(UserEntity owner, CampaignStatus status);

    /** Cuenta total de sesiones para una campaña específica. */
    @Query("SELECT COUNT(s) FROM SessionEntity s WHERE s.campaign.id = :campaignId")
    long countSessionsByCampaignId(@Param("campaignId") Long campaignId);
}
