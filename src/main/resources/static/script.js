/**
 * DM ENGINE - Script Principal
 * Conectado al backend Spring Boot en /api/characters
 * Fallback a localStorage si el servidor no está disponible
 */

// --- CONFIGURACIÓN ---
// Ruta relativa: funciona sin importar el puerto o dominio donde corra el servidor
const API_BASE = '/api';
let useBackend = true; // Se detecta automáticamente al cargar

// --- ESTADO GLOBAL ---
let allCharacters = [];
let combatOrder = [];
let currentInitId = null;

// --- DICCIONARIO DE IMÁGENES ---
const raceGallery = {
    "Human":     { "M": "https://www.dndbeyond.com/avatars/thumbnails/6/256/420/618/636271780799451982.jpeg",  "F": "https://www.dndbeyond.com/avatars/thumbnails/6/257/420/618/636271781267451352.jpeg" },
    "Elf":       { "M": "https://www.dndbeyond.com/avatars/thumbnails/6/284/420/618/636272035279569304.jpeg",  "F": "https://www.dndbeyond.com/avatars/thumbnails/6/285/420/618/636272036234310574.jpeg" },
    "Dwarf":     { "M": "https://www.dndbeyond.com/avatars/thumbnails/6/254/420/618/636271780222891984.jpeg",  "F": "https://www.dndbeyond.com/avatars/thumbnails/6/255/420/618/636271781031302302.jpeg" },
    "Orc":       { "M": "https://www.dndbeyond.com/avatars/thumbnails/30845/428/420/618/638042125345719365.png", "F": "https://www.dndbeyond.com/avatars/thumbnails/30845/429/420/618/638042125796245138.png" },
    "Tiefling":  { "M": "https://www.dndbeyond.com/avatars/thumbnails/7/7/420/618/636272322449445694.jpeg",   "F": "https://www.dndbeyond.com/avatars/thumbnails/7/8/420/618/636272323067251351.jpeg" },
    "Dragonborn":{ "M": "https://www.dndbeyond.com/avatars/thumbnails/6/258/420/618/636271801914013318.jpeg",  "F": "https://www.dndbeyond.com/avatars/thumbnails/6/259/420/618/636271802513264405.jpeg" },
    "Gnome":     { "M": "https://www.dndbeyond.com/avatars/thumbnails/6/334/420/618/636272635395992331.jpeg",  "F": "https://www.dndbeyond.com/avatars/thumbnails/6/335/420/618/636272636306540671.jpeg" },
    "Halfling":  { "M": "https://www.dndbeyond.com/avatars/thumbnails/6/256/420/618/636271780799451982.jpeg",  "F": "https://www.dndbeyond.com/avatars/thumbnails/6/255/420/618/636271781031302302.jpeg" },
    "Fairy":     { "M": "https://www.dndbeyond.com/avatars/thumbnails/20472/380/420/618/637677404805539504.png","F": "https://www.dndbeyond.com/avatars/thumbnails/20472/380/420/618/637677404805539504.png" },
    "Shifter":   { "M": "https://www.dndbeyond.com/avatars/thumbnails/7766/315/420/618/637120300127583445.png", "F": "https://www.dndbeyond.com/avatars/thumbnails/7766/315/420/618/637120300127583445.png" },
    "Warforged": { "M": "https://www.dndbeyond.com/avatars/thumbnails/7766/317/420/618/637120300185938479.png", "F": "https://www.dndbeyond.com/avatars/thumbnails/7766/317/420/618/637120300185938479.png" },
    "Goliath":   { "M": "https://www.dndbeyond.com/avatars/thumbnails/30845/419/420/618/638042123530752112.png", "F": "https://www.dndbeyond.com/avatars/thumbnails/30845/420/420/618/638042123984166286.png" },
    "Aasimar":   { "M": "https://www.dndbeyond.com/avatars/thumbnails/30845/407/420/618/638042121020786522.png", "F": "https://www.dndbeyond.com/avatars/thumbnails/30845/408/420/618/638042121469032731.png" }
};

// =============================================
// INICIALIZACIÓN
// =============================================
window.onload = async () => {
    await loadCharacters();
    addLog("Motor Elite cargado", 'blue');
};

// =============================================
// CAPA DE DATOS — Backend con fallback a localStorage
// =============================================

async function loadCharacters() {
    try {
        const res = await fetch(`${API_BASE}/characters`);
        if (!res.ok) throw new Error('Backend no disponible');
        allCharacters = await res.json();
        useBackend = true;
        setServerStatus(true);
        addLog("Conectado al servidor 🟢", 'blue');
    } catch (e) {
        useBackend = false;
        allCharacters = JSON.parse(localStorage.getItem('dm_engine_chars')) || [];
        setServerStatus(false);
        addLog("Modo offline — usando localStorage 🟡", 'amber');
    }
    renderAll();
}

function setServerStatus(online) {
    const dot  = document.getElementById('serverStatus');
    const text = document.getElementById('serverStatusText');
    if (!dot || !text) return;
    if (online) {
        dot.className  = 'status-dot status-online';
        text.textContent = 'SERVIDOR ACTIVO';
        text.style.color = 'rgba(34,197,94,0.7)';
    } else {
        dot.className  = 'status-dot status-offline';
        text.textContent = 'MODO OFFLINE';
        text.style.color = 'rgba(245,158,11,0.7)';
    }
}

function syncLocal() {
    localStorage.setItem('dm_engine_chars', JSON.stringify(allCharacters));
}

// =============================================
// CRUD
// =============================================

async function saveCharacter() {
    const name = document.getElementById('charName').value.trim();
    if (!name) return alert("¡Por el martillo de Moradin! Necesitas un nombre.");

    const character = {
        name,
        race:        document.getElementById('charRace').value,
        gender:      document.getElementById('charGender').value,
        charClass:   document.getElementById('charClass').value,
        background:  document.getElementById('charBackground').value,
        alignment:   document.getElementById('charAlignment').value,
        type:        document.getElementById('charCategory').value,
        level:       parseInt(document.getElementById('charLevel').value) || 1,
        hp:          parseInt(document.getElementById('charHp').value) || 10,
        str:         parseInt(document.getElementById('charStr').value) || 10,
        dex:         parseInt(document.getElementById('charDex').value) || 10,
        con:         parseInt(document.getElementById('charCon').value) || 10,
        intel:       parseInt(document.getElementById('charInt').value) || 10,
        wis:         parseInt(document.getElementById('charWis').value) || 10,
        cha:         parseInt(document.getElementById('charCha').value) || 10,
        description: document.getElementById('charDesc').value,
        isDead:      false
    };

    if (useBackend) {
        try {
            const res = await fetch(`${API_BASE}/characters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(character)
            });
            if (!res.ok) {
                const err = await res.json();
                return alert("Error: " + (err.message || 'No se pudo guardar'));
            }
            const saved = await res.json();
            allCharacters.push(saved);
        } catch (e) {
            addLog("Error al conectar con el servidor", 'red');
            return;
        }
    } else {
        character.id = Date.now();
        allCharacters.push(character);
        syncLocal();
    }

    renderAll();
    resetInvocacionForm();
    addLog(`Nuevo aventurero: ${character.name}`, 'blue');
}

async function updateCharacter() {
    const id = parseInt(document.getElementById('editId').value);
    const index = allCharacters.findIndex(c => c.id === id);
    if (index === -1) return;

    const updated = {
        ...allCharacters[index],
        name:        document.getElementById('editName').value,
        race:        document.getElementById('editRace').value,
        gender:      document.getElementById('editGender').value,
        charClass:   document.getElementById('editClass').value,
        level:       parseInt(document.getElementById('editLevel').value),
        hp:          parseInt(document.getElementById('editHp').value),
        str:         parseInt(document.getElementById('editStr').value),
        dex:         parseInt(document.getElementById('editDex').value),
        con:         parseInt(document.getElementById('editCon').value),
        intel:       parseInt(document.getElementById('editInt').value),
        wis:         parseInt(document.getElementById('editWis').value),
        cha:         parseInt(document.getElementById('editCha').value),
        description: document.getElementById('editDesc').value
    };

    if (useBackend) {
        try {
            const res = await fetch(`${API_BASE}/characters/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            if (!res.ok) return alert("Error al actualizar");
            allCharacters[index] = await res.json();
        } catch (e) {
            addLog("Error al actualizar en el servidor", 'red');
            return;
        }
    } else {
        allCharacters[index] = updated;
        syncLocal();
    }

    renderAll();
    closeEditModal();
    addLog(`Ficha de ${updated.name} actualizada.`, 'amber');
}

async function deleteChar(id) {
    if (useBackend) {
        try {
            const res = await fetch(`${API_BASE}/characters/${id}`, { method: 'DELETE' });
            if (!res.ok) return alert("Error al eliminar");
        } catch (e) {
            addLog("Error al eliminar del servidor", 'red');
            return;
        }
    }
    allCharacters = allCharacters.filter(c => c.id !== id);
    if (!useBackend) syncLocal();
    renderAll();
    closeDeleteModal();
    addLog("Entidad eliminada del registro.", 'red');
}

async function toggleDeath(id) {
    const index = allCharacters.findIndex(c => c.id === id);
    if (index === -1) return;

    if (useBackend) {
        try {
            const res = await fetch(`${API_BASE}/characters/${id}/toggle-death`, { method: 'PATCH' });
            if (!res.ok) return;
            allCharacters[index] = await res.json();
        } catch (e) {
            // fallback local
            allCharacters[index].isDead = !allCharacters[index].isDead;
        }
    } else {
        allCharacters[index].isDead = !allCharacters[index].isDead;
        syncLocal();
    }

    const char = allCharacters[index];
    renderAll();
    addLog(`${char.name} ha ${char.isDead ? 'caído en combate 💀' : 'resucitado ❤️'}.`, 'red');
}

async function purgeDead() {
    const deadCount = allCharacters.filter(c => c.isDead).length;
    if (deadCount === 0) return addLog("No hay caídos que purgar.", 'white');
    if (!confirm(`¿Seguro que querés eliminar a los ${deadCount} caídos?`)) return;

    if (useBackend) {
        try {
            const res = await fetch(`${API_BASE}/characters/purge-dead`, { method: 'DELETE' });
            if (res.ok) {
                const data = await res.json();
                addLog(data.message, 'red');
            }
        } catch (e) {
            addLog("Error al purgar en el servidor", 'red');
        }
    } else {
        addLog(`Se han purgado ${deadCount} entidades.`, 'red');
    }

    allCharacters = allCharacters.filter(c => !c.isDead);
    if (!useBackend) syncLocal();
    renderAll();
}

// =============================================
// GENERACIÓN DE NARRATIVA CON IA
// =============================================

async function generateRoom() {
    const modal = document.getElementById('narrativeModal');
    const content = document.getElementById('narrativeContent');
    const ctxInput = document.getElementById('narrativeContext');
    if (!modal) return;

    modal.style.display = 'flex';
    const context = ctxInput?.value?.trim() || 'una mazmorra oscura y misteriosa';
    content.innerHTML = '<span style="color:rgba(232,220,200,0.3); font-style:italic;">✦ Consultando al Dungeon Master IA...</span>';

    try {
        const res = await fetch(`${API_BASE}/campaign/generate-room?context=${encodeURIComponent(context)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        content.innerHTML = `<span style="color:#e8dcc8;">${data.narrative}</span>`;
        addLog("🎭 Narrativa generada", 'purple');
    } catch (e) {
        content.innerHTML = '<span style="color:#fca5a5;">No se pudo conectar con la IA. Verificá que el servidor esté activo.</span>';
    }
}

function closeNarrativeModal() {
    const modal = document.getElementById('narrativeModal');
    if (modal) modal.style.display = 'none';
}

// =============================================
// RENDER
// =============================================

function renderAll() {
    const lists = { MONSTRUO: 'monsterList', HEROE: 'heroList', NPC: 'npcList' };
    const counts = { MONSTRUO: 0, HEROE: 0, NPC: 0 };

    Object.values(lists).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = "";
    });

    allCharacters.forEach(char => {
        const listId = lists[char.type] || 'npcList';
        const targetList = document.getElementById(listId);
        if (targetList) {
            targetList.innerHTML += createCard(char);
            counts[char.type] = (counts[char.type] || 0) + 1;
        }
    });

    updateCounters(counts);
}

function createCard(char) {
    const charData = JSON.stringify(char).replace(/"/g, '&quot;');
    const raceData = raceGallery[char.race] || null;
    const raceImg  = raceData ? (raceData[char.gender] || raceData["M"]) : "";
    const deadClass = char.isDead ? 'dead-card' : '';
    const displayHp = char.currentHp !== undefined && char.currentHp !== null ? char.currentHp : char.hp;
    const maxHp     = char.maxHp || char.hp || 0;
    const hpPercent = maxHp > 0 ? Math.round((displayHp / maxHp) * 100) : 0;
    const hpColor   = hpPercent > 60 ? '#22c55e' : hpPercent > 30 ? '#f59e0b' : '#ef4444';
    const borderClass = char.type === 'HEROE' ? 'card-hero' : char.type === 'MONSTRUO' ? 'card-monster' : 'card-npc';
    const modStr = v => { const m = Math.floor((v - 10) / 2); return (m >= 0 ? '+' : '') + m; };

    return `
        <div id="card-${char.id}" class="parchment parchment-hover rounded-xl ${borderClass} ${deadClass} anim-in" data-name="${char.name.toLowerCase()}">
            <!-- CABECERA -->
            <div class="flex gap-3 p-3 pb-2">
                <div class="w-14 h-14 rounded-full shrink-0 bg-cover bg-center shadow-lg"
                     style="background-image:url('${raceImg}'); border:2px solid rgba(139,105,20,0.5); background-color:#2a1a0a;"></div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start gap-1">
                        <span class="font-heading font-bold text-base leading-tight truncate" style="color:var(--ink);">${char.name}</span>
                        <span class="font-heading font-bold text-sm shrink-0" style="color:${hpColor};">${displayHp}<span class="text-xs opacity-50">/${maxHp}</span></span>
                    </div>
                    <div class="hp-bar-bg my-1.5">
                        <div class="hp-bar-fill" style="width:${hpPercent}%; background:${hpColor};"></div>
                    </div>
                    <div class="font-body text-xs leading-none" style="color:rgba(26,15,0,0.55);">
                        ${char.gender === 'F' ? '♀' : '♂'} ${char.race || ''} ${char.charClass ? '· ' + char.charClass : ''} ${char.level ? '· Nv.' + char.level : ''}
                    </div>
                </div>
            </div>

            <!-- STATS -->
            <div class="grid grid-cols-6 gap-1 px-3 pb-2">
                <div class="stat-box" style="background:rgba(0,0,0,0.08); border-color:rgba(139,105,20,0.2);">
                    <div class="stat-label" style="color:var(--gold-dark); font-size:8px;">STR</div>
                    <div style="font-size:12px; font-weight:700; color:var(--ink); line-height:1.2;">${char.str}</div>
                    <div style="font-size:9px; color:rgba(26,15,0,0.45);">${modStr(char.str||10)}</div>
                </div>
                <div class="stat-box" style="background:rgba(0,0,0,0.08); border-color:rgba(139,105,20,0.2);">
                    <div class="stat-label" style="color:var(--gold-dark); font-size:8px;">DEX</div>
                    <div style="font-size:12px; font-weight:700; color:var(--ink); line-height:1.2;">${char.dex}</div>
                    <div style="font-size:9px; color:rgba(26,15,0,0.45);">${modStr(char.dex||10)}</div>
                </div>
                <div class="stat-box" style="background:rgba(0,0,0,0.08); border-color:rgba(139,105,20,0.2);">
                    <div class="stat-label" style="color:var(--gold-dark); font-size:8px;">CON</div>
                    <div style="font-size:12px; font-weight:700; color:var(--ink); line-height:1.2;">${char.con}</div>
                    <div style="font-size:9px; color:rgba(26,15,0,0.45);">${modStr(char.con||10)}</div>
                </div>
                <div class="stat-box" style="background:rgba(0,0,0,0.08); border-color:rgba(139,105,20,0.2);">
                    <div class="stat-label" style="color:var(--gold-dark); font-size:8px;">INT</div>
                    <div style="font-size:12px; font-weight:700; color:var(--ink); line-height:1.2;">${char.intel}</div>
                    <div style="font-size:9px; color:rgba(26,15,0,0.45);">${modStr(char.intel||10)}</div>
                </div>
                <div class="stat-box" style="background:rgba(0,0,0,0.08); border-color:rgba(139,105,20,0.2);">
                    <div class="stat-label" style="color:var(--gold-dark); font-size:8px;">WIS</div>
                    <div style="font-size:12px; font-weight:700; color:var(--ink); line-height:1.2;">${char.wis}</div>
                    <div style="font-size:9px; color:rgba(26,15,0,0.45);">${modStr(char.wis||10)}</div>
                </div>
                <div class="stat-box" style="background:rgba(0,0,0,0.08); border-color:rgba(139,105,20,0.2);">
                    <div class="stat-label" style="color:var(--gold-dark); font-size:8px;">CHA</div>
                    <div style="font-size:12px; font-weight:700; color:var(--ink); line-height:1.2;">${char.cha}</div>
                    <div style="font-size:9px; color:rgba(26,15,0,0.45);">${modStr(char.cha||10)}</div>
                </div>
            </div>

            <!-- DESCRIPCIÓN -->
            ${char.description ? `<div class="px-3 pb-2 font-body text-xs italic leading-snug" style="color:rgba(26,15,0,0.55); border-top:1px solid rgba(139,105,20,0.15); padding-top:6px;">${char.description.substring(0,80)}${char.description.length>80?'…':''}</div>` : ''}

            <!-- ACCIONES -->
            <div class="flex items-center justify-between px-3 pb-3 pt-1" style="border-top:1px solid rgba(139,105,20,0.15);">
                <div class="flex gap-1.5">
                    <button onclick="openInitModal(${char.id}, '${char.name.replace(/'/g,"\\\'")}')" class="btn-icon text-sm" style="width:28px;height:28px;background:rgba(139,92,246,0.15);color:#c4b5fd;border-color:rgba(139,92,246,0.3);" title="Iniciativa">🎲</button>
                    <button onclick="openEditModal(${charData})" class="btn-icon text-sm" style="width:28px;height:28px;background:rgba(201,168,76,0.1);color:var(--gold);border-color:rgba(201,168,76,0.3);" title="Editar">✏️</button>
                    <button onclick="toggleDeath(${char.id})" class="btn-icon text-sm" style="width:28px;height:28px;background:rgba(139,26,26,0.1);color:#fca5a5;border-color:rgba(139,26,26,0.3);" title="${char.isDead ? 'Revivir' : 'Marcar muerto'}">${char.isDead ? '❤️' : '💀'}</button>
                    <button onclick="openDeleteModal(${char.id})" class="btn-icon text-sm" style="width:28px;height:28px;background:rgba(239,68,68,0.1);color:#f87171;border-color:rgba(239,68,68,0.2);" title="Eliminar">🗑️</button>
                </div>
                ${char.alignment ? `<span class="font-heading text-[10px] px-2 py-0.5 rounded" style="background:rgba(0,0,0,0.1); color:rgba(26,15,0,0.45); border:1px solid rgba(0,0,0,0.1);">${char.alignment}</span>` : ''}
            </div>
        </div>
    `;
}

// =============================================
// DADOS
// =============================================

function rollDice(faces) {
    const result = Math.floor(Math.random() * faces) + 1;
    const display = document.getElementById('diceResult').querySelector('span');
    let counter = 0;
    const interval = setInterval(() => {
        display.innerText = Math.floor(Math.random() * faces) + 1;
        if (++counter > 10) {
            clearInterval(interval);
            display.innerText = result;
            addLog(`Resultado d${faces}: ${result}`, 'amber');
        }
    }, 50);
}

// =============================================
// INICIATIVA
// =============================================

function openInitModal(id, name) {
    currentInitId = id;
    document.getElementById('initModalName').innerText = name;
    document.getElementById('manualRoll').value = "";
    document.getElementById('initiativeModal').style.display = 'flex';
}

function confirmManualInitiative() {
    const val = parseInt(document.getElementById('manualRoll').value);
    if (isNaN(val)) return;
    combatOrder = combatOrder.filter(c => c.id !== currentInitId);
    combatOrder.push({ id: currentInitId, name: document.getElementById('initModalName').innerText, total: val });
    combatOrder.sort((a, b) => b.total - a.total);
    renderInitiative();
    closeInitModal();
    addLog(`Iniciativa de ${document.getElementById('initModalName').innerText}: ${val}`, 'purple');
}

function renderInitiative() {
    const list = document.getElementById('initiativeList');
    const badge = document.getElementById('currentTurnBadge');
    list.innerHTML = "";
    if (combatOrder.length === 0) {
        if (badge) badge.textContent = '—';
        return;
    }
    if (badge) badge.textContent = combatOrder[0].name;
    combatOrder.forEach((char, index) => {
        const isActive = index === 0;
        list.innerHTML += `
            <div class="flex items-center gap-2 px-3 py-2 rounded-lg anim-in ${isActive ? 'glow-pulse' : ''}"
                 style="background:${isActive ? 'rgba(139,92,246,0.15)' : 'rgba(0,0,0,0.2)'}; border:1px solid ${isActive ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.05)'};">
                <span class="font-heading text-xs w-5 h-5 flex items-center justify-center rounded-full shrink-0"
                      style="background:${isActive ? '#7c3aed' : 'rgba(255,255,255,0.1)'}; color:${isActive ? '#fff' : 'rgba(255,255,255,0.4)'};">${index + 1}</span>
                <span class="font-heading text-sm flex-1 truncate" style="color:${isActive ? '#e9d5ff' : 'rgba(232,220,200,0.6)'};">${char.name}</span>
                <span class="font-title text-lg" style="color:${isActive ? '#f0d080' : 'rgba(201,168,76,0.5)'};">${char.total}</span>
            </div>`;
    });
}

let currentTurnIndex = 0;
function nextTurn() {
    if (combatOrder.length === 0) return;
    currentTurnIndex = (currentTurnIndex + 1) % combatOrder.length;
    const rotated = [...combatOrder.slice(currentTurnIndex), ...combatOrder.slice(0, currentTurnIndex)];
    const badge = document.getElementById('currentTurnBadge');
    if (badge) badge.textContent = rotated[0].name;
    addLog(`Turno de: ${rotated[0].name}`, 'purple');
    renderInitiative();
}

// =============================================
// BITÁCORA
// =============================================

function addLog(message, color = 'white') {
    const log = document.getElementById('logEntries');
    if (!log) return;
    const colors = {
        blue:   'rgba(147,197,253,0.9)',
        red:    'rgba(252,165,165,0.9)',
        amber:  'rgba(240,208,128,0.9)',
        purple: 'rgba(196,181,253,0.9)',
        white:  'rgba(232,220,200,0.7)'
    };
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const entry = document.createElement('div');
    entry.className = 'log-entry py-1.5 px-2 rounded text-xs';
    entry.style.cssText = `color:${colors[color]||colors.white}; border-bottom:1px solid rgba(255,255,255,0.04);`;
    entry.innerHTML = `<span style="opacity:0.3; margin-right:6px; font-family:'Cinzel',serif;">[${time}]</span>${message}`;
    log.prepend(entry);
}

// =============================================
// MODALES Y UI
// =============================================

function openEditModal(char) {
    document.getElementById('editId').value = char.id;
    document.getElementById('editName').value = char.name;
    document.getElementById('editRace').value = char.race || "";
    document.getElementById('editGender').value = char.gender || "M";
    document.getElementById('editClass').value = char.charClass || "";
    document.getElementById('editLevel').value = char.level;
    document.getElementById('editHp').value = char.hp;
    document.getElementById('editStr').value = char.str;
    document.getElementById('editDex').value = char.dex;
    document.getElementById('editCon').value = char.con;
    document.getElementById('editInt').value = char.intel;
    document.getElementById('editWis').value = char.wis;
    document.getElementById('editCha').value = char.cha;
    document.getElementById('editDesc').value = char.description || "";
    updateRacePreview('editRacePreview', char.race);
    document.getElementById('editModal').style.display = 'flex';
}

function updateRacePreview(containerId, race) {
    const gender = containerId === 'racePreview'
        ? document.getElementById('charGender').value
        : document.getElementById('editGender').value;
    const container = document.getElementById(containerId);
    if (race && raceGallery[race]) {
        container.style.backgroundImage = `url('${raceGallery[race][gender] || raceGallery[race]["M"]}')`;
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

function openDeleteModal(id) {
    currentInitId = id;
    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('confirmDeleteBtn').onclick = () => deleteChar(currentInitId);
}

function updateCounters(counts) {
    document.getElementById('countMonsters').innerText = counts['MONSTRUO'] || 0;
    document.getElementById('countHeroes').innerText   = counts['HEROE']    || 0;
    document.getElementById('countNPCs').innerText     = counts['NPC']      || 0;
}

function filterList(listId, query) {
    const list = document.getElementById(listId);
    const cards = list.getElementsByClassName('parchment');
    const q = query.toLowerCase();
    for (let card of cards) {
        card.style.display = card.getAttribute('data-name').includes(q) ? "block" : "none";
    }
}

function resetInvocacionForm() {
    ['charName', 'charClass', 'charBackground', 'charDesc'].forEach(id => {
        document.getElementById(id).value = "";
    });
    document.getElementById('racePreview').classList.add('hidden');
}

function toggleDiceRoller() { document.getElementById('dicePanel').classList.toggle('hidden'); }
function toggleLog()         { document.getElementById('combatLogPanel').classList.toggle('hidden'); }
function closeEditModal()    { document.getElementById('editModal').style.display = 'none'; }
function closeDeleteModal()  { document.getElementById('deleteModal').style.display = 'none'; }
function closeInitModal()    { document.getElementById('initiativeModal').style.display = 'none'; }
function clearInitiative()   { combatOrder = []; currentTurnIndex = 0; renderInitiative(); }
