package com.vkdev.dmengine.core.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "characters")
public class CharacterEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type;        // MONSTRUO, HEROE, NPC
    private String race;        
    private String gender;      
    private String charClass;   
    private String background;  
    private String alignment;   
    private String status;      // Para estados como "Envenenado", "Inconsciente", etc.
    
    private Integer level;
    private Integer hp;

    private Integer str;
    private Integer dex;
    private Integer con;
    private Integer intel;
    private Integer wis;
    private Integer cha;
    
    @Column(columnDefinition = "TEXT")
    private String description;

    public CharacterEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getRace() { return race; }
    public void setRace(String race) { this.race = race; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getCharClass() { return charClass; }
    public void setCharClass(String charClass) { this.charClass = charClass; }
    public String getBackground() { return background; }
    public void setBackground(String background) { this.background = background; }
    public String getAlignment() { return alignment; }
    public void setAlignment(String alignment) { this.alignment = alignment; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    public Integer getHp() { return hp; }
    public void setHp(Integer hp) { this.hp = hp; }
    public Integer getStr() { return str; }
    public void setStr(Integer str) { this.str = str; }
    public Integer getDex() { return dex; }
    public void setDex(Integer dex) { this.dex = dex; }
    public Integer getCon() { return con; }
    public void setCon(Integer con) { this.con = con; }
    public Integer getIntel() { return intel; }
    public void setIntel(Integer intel) { this.intel = intel; }
    public Integer getWis() { return wis; }
    public void setWis(Integer wis) { this.wis = wis; }
    public Integer getCha() { return cha; }
    public void setCha(Integer cha) { this.cha = cha; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}