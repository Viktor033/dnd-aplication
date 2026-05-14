package com.vkdev.dmengine.infrastructure.adapters.rest;

import com.vkdev.dmengine.core.domain.CharacterEntity;
import com.vkdev.dmengine.core.ports.CharacterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/characters")
@CrossOrigin(origins = "*") // Importante para que el index.html lo vea
public class CharacterController {

    @Autowired
    private CharacterRepository characterRepository;

    @GetMapping
    public List<CharacterEntity> getAll() {
        return characterRepository.findAll();
    }

    @PostMapping
    public CharacterEntity save(@RequestBody CharacterEntity character) {
        return characterRepository.save(character);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        characterRepository.deleteById(id);
    }
}