package com.vkdev.dmengine.core.domain;

/**
 * Estados posibles de una Campaña.
 */
public enum CampaignStatus {
    /** Campaña en curso, con sesiones activas. */
    ACTIVE,
    /** Campaña temporalmente detenida (pausa entre sesiones). */
    PAUSED,
    /** Campaña finalizada (historia concluida). */
    COMPLETED
}
