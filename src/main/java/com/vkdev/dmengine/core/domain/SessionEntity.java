package com.vkdev.dmengine.core.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

/**
 * Entidad JPA que representa una Sesión de juego dentro de una Campaña.
 * Cada sesión pertenece a exactamente una campaña.
 *
 * Los tags se almacenan como CSV en un campo TEXT (ej: "COMBAT,ROLEPLAY,MYSTERY")
 * para mantener simplicidad sin tabla asociada. El frontend los parsea al cargar.
 */
@Entity
@Table(name = "sessions")
public class SessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Número secuencial de la sesión dentro de la campaña (ej. 1, 2, 3...). */
    private Integer sessionNumber;

    @NotBlank(message = "El título de la sesión no puede estar vacío")
    private String title;

    /** Resumen narrativo de lo que ocurrió en la sesión. */
    @Column(columnDefinition = "TEXT")
    private String summary;

    /**
     * Estado de la sesión.
     * IN_PROGRESS = sesión actualmente en curso.
     * COMPLETED   = sesión finalizada y registrada.
     */
    @Enumerated(EnumType.STRING)
    private SessionStatus status = SessionStatus.COMPLETED;

    /** Duración de la sesión en minutos. */
    private Integer durationMinutes;

    /** Cantidad de encuentros de combate en la sesión. */
    private Integer combatCount = 0;

    /** Cantidad de enemigos/monstruos derrotados. */
    private Integer enemiesDefeated = 0;

    /** Cantidad de NPCs con los que el grupo interactuó significativamente. */
    private Integer npcCount = 0;

    /**
     * Tags temáticos de la sesión en formato CSV.
     * Valores posibles: COMBAT, ROLEPLAY, EXPLORATION, MYSTERY, NEAR_DEATH, LOOT
     * Ejemplo: "COMBAT,ROLEPLAY,NEAR_DEATH"
     */
    @Column(columnDefinition = "TEXT")
    private String tags;

    /** Fecha y hora en que se jugó la sesión. */
    private LocalDateTime playedAt;

    /** Campaña a la que pertenece esta sesión. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "campaign_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private CampaignEntity campaign;

    /** ID de la campaña expuesto en el JSON de respuesta (sin serializar la campaña completa). */
    @Transient
    private Long campaignId;

    public SessionEntity() {}

    @PrePersist
    protected void onCreate() {
        if (this.playedAt == null) {
            this.playedAt = LocalDateTime.now();
        }
    }

    /** Carga el campaignId desde la relación antes de serializar. */
    @PostLoad
    protected void onLoad() {
        if (this.campaign != null) {
            this.campaignId = this.campaign.getId();
        }
    }

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getSessionNumber() { return sessionNumber; }
    public void setSessionNumber(Integer sessionNumber) { this.sessionNumber = sessionNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public SessionStatus getStatus() { return status; }
    public void setStatus(SessionStatus status) { this.status = status; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public Integer getCombatCount() { return combatCount; }
    public void setCombatCount(Integer combatCount) { this.combatCount = combatCount; }

    public Integer getEnemiesDefeated() { return enemiesDefeated; }
    public void setEnemiesDefeated(Integer enemiesDefeated) { this.enemiesDefeated = enemiesDefeated; }

    public Integer getNpcCount() { return npcCount; }
    public void setNpcCount(Integer npcCount) { this.npcCount = npcCount; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public LocalDateTime getPlayedAt() { return playedAt; }
    public void setPlayedAt(LocalDateTime playedAt) { this.playedAt = playedAt; }

    public CampaignEntity getCampaign() { return campaign; }
    public void setCampaign(CampaignEntity campaign) {
        this.campaign = campaign;
        if (campaign != null) this.campaignId = campaign.getId();
    }

    public Long getCampaignId() { return campaignId; }
    public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }
}
