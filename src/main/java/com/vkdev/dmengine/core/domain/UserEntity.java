package com.vkdev.dmengine.core.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El email no puede estar vacío")
    @Email(message = "El formato del email es inválido")
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank(message = "La contraseña no puede estar vacía")
    @Column(nullable = false)
    @JsonIgnore
    private String password;

    private String role = "ROLE_USER"; // ROLE_USER, ROLE_ADMIN

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_tier", nullable = false)
    private SubscriptionTier subscriptionTier = SubscriptionTier.AVENTURERO;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<CharacterEntity> characters;

    public UserEntity() {}

    public UserEntity(String email, String password, SubscriptionTier subscriptionTier) {
        this.email = email;
        this.password = password;
        this.subscriptionTier = subscriptionTier;
        this.role = "ROLE_USER";
    }

    // --- Getters y Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public SubscriptionTier getSubscriptionTier() { return subscriptionTier; }
    public void setSubscriptionTier(SubscriptionTier subscriptionTier) { this.subscriptionTier = subscriptionTier; }

    public List<CharacterEntity> getCharacters() { return characters; }
    public void setCharacters(List<CharacterEntity> characters) { this.characters = characters; }
}
