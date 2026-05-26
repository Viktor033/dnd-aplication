package com.vkdev.dmengine.infrastructure.adapters.rest;

import com.vkdev.dmengine.core.domain.SubscriptionTier;
import com.vkdev.dmengine.core.domain.UserEntity;
import com.vkdev.dmengine.core.ports.UserRepository;
import com.vkdev.dmengine.infrastructure.adapters.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(UserRepository userRepository, 
                          PasswordEncoder passwordEncoder, 
                          JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El email y la contraseña son requeridos"));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "El email ya está registrado"));
        }

        UserEntity user = new UserEntity(
                email.trim(), 
                passwordEncoder.encode(password), 
                SubscriptionTier.AVENTURERO
        );

        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Usuario registrado exitosamente"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "El email y la contraseña son requeridos"));
        }

        return userRepository.findByEmail(email)
                .map(user -> {
                    if (passwordEncoder.matches(password, user.getPassword())) {
                        String token = tokenProvider.generateToken(
                                user.getEmail(), 
                                user.getRole(), 
                                user.getSubscriptionTier().name()
                        );
                        return ResponseEntity.ok(Map.of(
                                "token", token,
                                "email", user.getEmail(),
                                "tier", user.getSubscriptionTier().name()
                        ));
                    } else {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(Map.of("message", "Credenciales inválidas"));
                    }
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Credenciales inválidas")));
    }

    /**
     * Endpoint especial para simular el pago/upgrade en el SaaS.
     * Recibe email y el tier destino (DUNGEON_MASTER o LEYENDA)
     * Retorna un nuevo JWT con el plan actualizado.
     */
    @PostMapping("/upgrade-simulation")
    public ResponseEntity<?> upgradeSimulation(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String tierStr = body.get("tier");

        if (email == null || tierStr == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email y tier destino son requeridos"));
        }

        return userRepository.findByEmail(email)
                .map(user -> {
                    try {
                        SubscriptionTier newTier = SubscriptionTier.valueOf(tierStr.toUpperCase());
                        user.setSubscriptionTier(newTier);
                        userRepository.save(user);

                        // Generar nuevo token con el tier actualizado
                        String token = tokenProvider.generateToken(
                                user.getEmail(), 
                                user.getRole(), 
                                user.getSubscriptionTier().name()
                        );

                        return ResponseEntity.ok(Map.of(
                                "token", token,
                                "email", user.getEmail(),
                                "tier", user.getSubscriptionTier().name(),
                                "message", "¡Felicidades! Has ascendido al plan " + newTier.name()
                        ));
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Tier inválido. Usa: DUNGEON_MASTER o LEYENDA"));
                    }
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Usuario no encontrado")));
    }
}
