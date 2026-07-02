package com.vkdev.dmengine.core.domain;

/**
 * Estados posibles de una Sesión de juego.
 */
public enum SessionStatus {
    /** Sesión actualmente en curso (solo puede haber una por campaña). */
    IN_PROGRESS,
    /** Sesión finalizada y registrada en el historial. */
    COMPLETED
}
