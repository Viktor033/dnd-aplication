package com.vkdev.dmengine.infrastructure.adapters;

import com.vkdev.dmengine.core.ports.AiProvider;
import org.springframework.stereotype.Service;

@Service
public class MockAiAdapter implements AiProvider {
    @Override
    public String generateNarrative(String prompt) {
        return "El Dungeon Master (IA) responde: 'Entras en una cripta húmeda en el Abismo. Las paredes susurran tu nombre...' [Prompt recibido: " + prompt + "]";
    }
}

