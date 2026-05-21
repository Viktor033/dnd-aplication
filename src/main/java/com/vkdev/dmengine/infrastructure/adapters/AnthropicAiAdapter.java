package com.vkdev.dmengine.infrastructure.adapters;

import com.vkdev.dmengine.core.ports.AiProvider;
import org.springframework.ai.anthropic.AnthropicChatModel;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;

import java.util.List;

/**
 * Adaptador real de IA usando Claude de Anthropic vía Spring AI.
 * No lleva @Service — se registra desde AiProviderConfig.
 * Requiere una API key válida de https://console.anthropic.com
 */
public class AnthropicAiAdapter implements AiProvider {

    private static final String SYSTEM_PROMPT = """
            Eres un Dungeon Master experto de Dungeons & Dragons 5e.
            Tu rol es generar narrativas inmersivas, descripciones de escenas, encuentros y personajes.
            Responde siempre en español, con un tono épico y dramático.
            Sé conciso pero evocador. Máximo 3 párrafos por respuesta.
            """;

    private final AnthropicChatModel chatModel;

    public AnthropicAiAdapter(AnthropicChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @Override
    public String generateNarrative(String prompt) {
        Prompt aiPrompt = new Prompt(List.of(
                new SystemMessage(SYSTEM_PROMPT),
                new UserMessage(prompt)
        ));
        return chatModel.call(aiPrompt).getResult().getOutput().getText();
    }
}
