package com.vkdev.dmengine.core.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad JPA que representa una Campaña de rol.
 * Cada campaña pertenece a un usuario (aislamiento SaaS multi-tenant).
 * Una campaña agrupa múltiples sesiones jugadas.
 */
@Entity
@Table(name = "campaigns")
public class CampaignEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre de la campaña no puede estar vacío")
    private String name;

    /** Sistema de juego: "D&D 5e", "Pathfinder 2e", "Call of Cthulhu", etc. */
    private String system;

    /** Ambientación / setting: "Ravenloft", "Faerûn", "Homebrew", etc. */
    private String setting;

    /**
     * Estado de la campaña.
     * ACTIVE   = en curso, es la sesión actual.
     * PAUSED   = temporalmente detenida (próxima sesión pendiente).
     * COMPLETED = campaña finalizada.
     */
    @Enumerated(EnumType.STRING)
    private CampaignStatus status = CampaignStatus.ACTIVE;

    /** Nombre del arco narrativo actual (ej. "Arco I: El Dominio de Barovia"). */
    private String currentArc;

    /**
     * Progreso del arco actual en porcentaje (0-100).
     * Lo actualiza el DM manualmente o con lógica de negocio.
     */
    private Integer arcProgress = 0;

    /** Cantidad de jugadores en la campaña (sin contar el DM). */
    private Integer playerCount = 0;

    /** Fecha y hora de creación de la campaña. */
    private LocalDateTime createdAt;

    /** Fecha y hora de la última sesión jugada (se actualiza automáticamente). */
    private LocalDateTime lastPlayedAt;

    /**
     * Notas del DM sobre la campaña (plot hooks, secrets, etc.).
     * Ocultas a los jugadores en modo Player.
     */
    @Column(columnDefinition = "TEXT")
    private String dmNotes;

    /** Dueño de la campaña — aislamiento por usuario (SaaS). */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private UserEntity owner;

    /** Sesiones jugadas en esta campaña. Lazy para no cargar siempre todo. */
    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<SessionEntity> sessions = new ArrayList<>();

    /** Campo calculado: total de sesiones (no persistido, calculado en consulta). */
    @Transient
    private int totalSessions;

    public CampaignEntity() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSystem() { return system; }
    public void setSystem(String system) { this.system = system; }

    public String getSetting() { return setting; }
    public void setSetting(String setting) { this.setting = setting; }

    public CampaignStatus getStatus() { return status; }
    public void setStatus(CampaignStatus status) { this.status = status; }

    public String getCurrentArc() { return currentArc; }
    public void setCurrentArc(String currentArc) { this.currentArc = currentArc; }

    public Integer getArcProgress() { return arcProgress; }
    public void setArcProgress(Integer arcProgress) {
        this.arcProgress = arcProgress != null ? Math.max(0, Math.min(100, arcProgress)) : 0;
    }

    public Integer getPlayerCount() { return playerCount; }
    public void setPlayerCount(Integer playerCount) { this.playerCount = playerCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastPlayedAt() { return lastPlayedAt; }
    public void setLastPlayedAt(LocalDateTime lastPlayedAt) { this.lastPlayedAt = lastPlayedAt; }

    public String getDmNotes() { return dmNotes; }
    public void setDmNotes(String dmNotes) { this.dmNotes = dmNotes; }

    public UserEntity getOwner() { return owner; }
    public void setOwner(UserEntity owner) { this.owner = owner; }

    public List<SessionEntity> getSessions() { return sessions; }
    public void setSessions(List<SessionEntity> sessions) { this.sessions = sessions; }

    public int getTotalSessions() { return totalSessions; }
    public void setTotalSessions(int totalSessions) { this.totalSessions = totalSessions; }
}
