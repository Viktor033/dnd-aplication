package com.vkdev.dmengine.infrastructure.adapters;

import com.vkdev.dmengine.core.ports.AiProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registra el bean AiProvider correcto según la propiedad dmengine.ai.provider.
 * - mock (default): usa MockAiAdapter, no requiere API key
 * - anthropic: usa AnthropicAiAdapter, requiere spring.ai.anthropic.api-key real
 */
@Configuration
public class AiProviderConfig {

    @Bean
    @ConditionalOnProperty(name = "dmengine.ai.provider", havingValue = "mock", matchIfMissing = true)
    public AiProvider mockAiProvider() {
        return new MockAiAdapter();
    }

    @Bean
    @ConditionalOnProperty(name = "dmengine.ai.provider", havingValue = "anthropic")
    public AiProvider anthropicAiProvider(
            org.springframework.ai.anthropic.AnthropicChatModel chatModel) {
        return new AnthropicAiAdapter(chatModel);
    }
}
