package com.vkdev.dmengine.infrastructure.adapters;

import com.vkdev.dmengine.core.ports.AiProvider;

import java.util.List;
import java.util.Random;

/**
 * Adaptador de IA simulado para desarrollo y testing.
 * No lleva @Service — se registra desde AiProviderConfig.
 */
public class MockAiAdapter implements AiProvider {

    private static final List<String> NARRATIVES = List.of(
        "Entráis en una cripta húmeda. Las antorchas parpadean y las sombras danzan en las paredes de piedra. Un olor a muerte antigua llena el aire.",
        "El bosque se cierra a vuestro alrededor. Entre los árboles retorcidos, unos ojos brillan en la oscuridad. Algo os observa.",
        "La taberna está llena de susurros. El tabernero os mira con recelo mientras limpia un vaso que nunca parece quedar limpio.",
        "Ante vosotros se alza una torre en ruinas. Relámpagos iluminan brevemente una silueta en la ventana más alta.",
        "El río fluye negro como la tinta. En la orilla opuesta, una figura encapuchada os hace señas para que os acerquéis."
    );

    @Override
    public String generateNarrative(String prompt) {
        String base = NARRATIVES.get(new Random().nextInt(NARRATIVES.size()));
        return "[MODO DEMO] " + base + " | Contexto: \"" + prompt + "\"";
    }
}
