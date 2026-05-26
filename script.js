/**
 * DM ENGINE - Script Principal
 * Conectado al backend Spring Boot en /api/characters
 * Fallback a localStorage si el servidor no está disponible
 */

// --- CONFIGURACIÓN ---
const API_BASE = '/api';
let useBackend = true; // Se detecta automáticamente al cargar

// --- ESTADO GLOBAL ---
let allCharacters = [];
let combatOrder = [];
let currentInitId = null;  // ID activo en el modal de iniciativa
let currentDeleteId = null; // ID activo en el modal de borrado
let currentUser = null;     // Guardará el usuario logueado { email, tier }
let authMode = 'login';     // 'login' o 'register'

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
// AUXILIARES Y AUTENTICACIÓN SAAS
// =============================================

async function authFetch(url, options = {}) {
    options.headers = options.headers || {};
    const token = localStorage.getItem('dm_saas_token');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, options);
}

function decodeToken(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch(e) {
        return null;
    }
}

function updateSaasUI() {
    const token = localStorage.getItem('dm_saas_token');
    const payload = decodeToken(token);
    if (payload) {
        currentUser = { email: payload.sub, tier: payload.tier };
        document.getElementById('saasUserEmail').innerText = payload.sub;
        document.getElementById('saasUserTier').innerText = translateTier(payload.tier);
        document.getElementById('saasHeaderInfo').classList.remove('hidden');
        document.getElementById('saasLoginBtn').classList.add('hidden');
        
        if (payload.tier === 'LEYENDA') {
            document.getElementById('saasUpgradeBtn').classList.add('hidden');
        } else {
            document.getElementById('saasUpgradeBtn').classList.remove('hidden');
        }
    } else {
        currentUser = null;
        document.getElementById('saasHeaderInfo').classList.add('hidden');
        document.getElementById('saasLoginBtn').classList.remove('hidden');
    }
}

function translateTier(tier) {
    if (tier === 'AVENTURERO') return 'Aventurero ⚔️';
    if (tier === 'DUNGEON_MASTER') return 'PRO 🔮';
    if (tier === 'LEYENDA') return 'Leyenda ✨';
    return tier;
}

function openAuthModal() {
    authMode = 'login';
    document.getElementById('authTitle').innerText = "Gremio de Héroes";
    document.getElementById('authToggleText').innerText = "¿Eres un nuevo recluta?";
    document.getElementById('authToggleBtn').innerText = "Regístrate aquí";
    document.getElementById('authSubmitBtn').innerText = "Entrar al Gremio";
    document.getElementById('authEmail').value = "";
    document.getElementById('authPassword').value = "";
    document.getElementById('authErrorMsg').classList.add('hidden');
    document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
}

function toggleAuthMode() {
    document.getElementById('authErrorMsg').classList.add('hidden');
    if (authMode === 'login') {
        authMode = 'register';
        document.getElementById('authTitle').innerText = "Nuevo Reclutamiento";
        document.getElementById('authToggleText').innerText = "¿Ya eres miembro?";
        document.getElementById('authToggleBtn').innerText = "Inicia sesión aquí";
        document.getElementById('authSubmitBtn').innerText = "Forjar Cuenta";
    } else {
        authMode = 'login';
        document.getElementById('authTitle').innerText = "Gremio de Héroes";
        document.getElementById('authToggleText').innerText = "¿Eres un nuevo recluta?";
        document.getElementById('authToggleBtn').innerText = "Regístrate aquí";
        document.getElementById('authSubmitBtn').innerText = "Entrar al Gremio";
    }
}

async function handleAuthSubmit() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const errorDiv = document.getElementById('authErrorMsg');

    if (!email || !password) {
        errorDiv.innerText = "¡Por la barba de Odín! Rellena todos los campos.";
        errorDiv.classList.remove('hidden');
        return;
    }

    const url = `${API_BASE}/auth/${authMode}`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) {
            errorDiv.innerText = data.message || "Error al autenticar";
            errorDiv.classList.remove('hidden');
            return;
        }

        if (authMode === 'login') {
            localStorage.setItem('dm_saas_token', data.token);
            updateSaasUI();
            closeAuthModal();
            await loadCharacters();
            addLog(`Bienvenido, ${email}!`, 'blue');
        } else {
            alert("¡Cuenta forjada con éxito! Ahora puedes iniciar sesión.");
            authMode = 'login';
            toggleAuthMode();
        }
    } catch (e) {
        errorDiv.innerText = "No se pudo conectar con el servidor.";
        errorDiv.classList.remove('hidden');
    }
}

function handleLogout() {
    localStorage.removeItem('dm_saas_token');
    updateSaasUI();
    loadCharacters();
    addLog("Has abandonado el gremio", 'red');
}

function openPricingModal() {
    document.getElementById('pricingModal').classList.remove('hidden');
}

function closePricingModal() {
    document.getElementById('pricingModal').classList.add('hidden');
}

async function simulateUpgrade(tier) {
    const token = localStorage.getItem('dm_saas_token');
    if (!token) {
        alert("¡Por favor, inicia sesión antes de forjar tu suscripción!");
        closePricingModal();
        openAuthModal();
        return;
    }

    const payload = decodeToken(token);
    if (!payload) return;

    try {
        const res = await fetch(`${API_BASE}/auth/upgrade-simulation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: payload.sub, tier })
        });

        const data = await res.json();
        if (!res.ok) return alert(data.message || "Error en upgrade");

        localStorage.setItem('dm_saas_token', data.token);
        updateSaasUI();
        closePricingModal();
        await loadCharacters();

        // Mostrar animación mágica de LEVEL UP
        const levelUpModal = document.getElementById('levelUpModal');
        levelUpModal.querySelector('p').innerText = "Tu plan ha ascendido a " + translateTier(tier) + "!";
        levelUpModal.classList.remove('hidden');
        setTimeout(() => {
            levelUpModal.classList.add('hidden');
        }, 2500);

        addLog(`¡Upgrade exitoso al plan ${tier}!`, 'amber');
    } catch (e) {
        alert("No se pudo conectar con el servidor para simular el pago.");
    }
}

// =============================================
// INICIALIZACIÓN
// =============================================
window.onload = async () => {
    updateSaasUI();
    await loadCharacters();
    addLog("Motor Elite cargado", 'blue');
};

// =============================================
// CAPA DE DATOS — Backend con fallback a localStorage
// =============================================

async function loadCharacters() {
    try {
        const res = await authFetch(`${API_BASE}/characters`);
        if (!res.ok) throw new Error('Backend no disponible o no autorizado');
        allCharacters = await res.json();
        useBackend = true;
        addLog("Conectado al servidor 🟢", 'blue');
    } catch (e) {
        useBackend = false;
        allCharacters = JSON.parse(localStorage.getItem('dm_engine_chars')) || [];
        addLog("Modo offline o desautorizado — usando localStorage 🟡", 'amber');
    }
    renderAll();
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
            const res = await authFetch(`${API_BASE}/characters`, {
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
            const res = await authFetch(`${API_BASE}/characters/${id}`, {
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
            const res = await authFetch(`${API_BASE}/characters/${id}`, { method: 'DELETE' });
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
            const res = await authFetch(`${API_BASE}/characters/${id}/toggle-death`, { method: 'PATCH' });
            if (!res.ok) return;
            allCharacters[index] = await res.json();
        } catch (e) {
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
            const res = await authFetch(`${API_BASE}/characters/purge-dead`, { method: 'DELETE' });
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
// HP EN TIEMPO REAL
// =============================================

async function quickHpChange(id, delta) {
    await _applyHpDelta(id, delta);
}

async function applyCustomHp(id, sign) {
    const input = document.getElementById(`hpInput-${id}`);
    const amount = parseInt(input?.value);
    if (!amount || amount <= 0) return;
    input.value = '';
    await _applyHpDelta(id, sign * amount);
}

async function _applyHpDelta(id, delta) {
    const index = allCharacters.findIndex(c => c.id === id);
    if (index === -1) return;

    if (useBackend) {
        try {
            const res = await authFetch(`${API_BASE}/characters/${id}/hp`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ delta })
            });
            if (!res.ok) return;
            allCharacters[index] = await res.json();
        } catch (e) {
            _applyHpDeltaLocal(index, delta);
        }
    } else {
        _applyHpDeltaLocal(index, delta);
        syncLocal();
    }

    const char = allCharacters[index];
    const verb = delta > 0 ? `curado ${delta} HP ❤️‍🩹` : `recibido ${Math.abs(delta)} de daño ⚔️`;
    addLog(`${char.name} ha ${verb}. HP: ${char.currentHp ?? char.hp}/${char.maxHp ?? char.hp}`, delta > 0 ? 'amber' : 'red');
    renderAll();
}

function _applyHpDeltaLocal(index, delta) {
    const char = allCharacters[index];
    const max = char.maxHp || char.hp || 0;
    let current = char.currentHp !== null && char.currentHp !== undefined ? char.currentHp : char.hp;
    current = Math.max(0, Math.min(max, current + delta));
    char.currentHp = current;
    if (current === 0) char.isDead = true;
}

// =============================================
// GENERACIÓN DE NARRATIVA CON IA
// =============================================

async function generateRoom() {
    const context = prompt("Describí el contexto de la escena (ej: una mazmorra oscura con trampas):");
    if (!context) return;

    addLog("Consultando al Dungeon Master IA...", 'purple');

    try {
        const res = await authFetch(`${API_BASE}/campaign/generate-room?context=${encodeURIComponent(context)}`);
        
        if (res.status === 403) {
            alert("🔒 ¡Alto ahí, Aventurero! La IA real de Claude requiere el plan Dungeon Master o Leyenda.");
            openPricingModal();
            return;
        }

        if (!res.ok) throw new Error();
        const data = await res.json();
        addLog("🎭 DM: " + data.narrative, 'purple');
        alert("🎭 Dungeon Master dice:\n\n" + data.narrative);
    } catch (e) {
        addLog("No se pudo conectar con la IA", 'red');
    }
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

function getModifier(score) {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

function createCard(char) {
    const charData = JSON.stringify(char).replace(/"/g, '&quot;');
    const raceData = raceGallery[char.race] || null;
    const raceImg = raceData ? (raceData[char.gender] || raceData["M"]) : "";
    const deadClass = char.isDead ? 'opacity-40 grayscale' : '';
    const displayHp = char.currentHp !== undefined && char.currentHp !== null ? char.currentHp : char.hp;
    const maxHp = char.maxHp || char.hp || 0;
    const hpPercent = maxHp > 0 ? Math.max(0, Math.round((displayHp / maxHp) * 100)) : 0;
    const hpColor = hpPercent > 60 ? 'bg-green-600' : hpPercent > 30 ? 'bg-yellow-500' : 'bg-red-600';
    const statusBadge = char.status ? `<span class="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/40 ml-1">${char.status}</span>` : '';

    return `
        <div id="card-${char.id}" class="parchment p-4 rounded-xl shadow-lg border-l-8 ${getBorderColor(char.type)} group ${deadClass}" data-name="${char.name.toLowerCase()}">
            <div class="flex gap-3 border-b border-black/10 mb-2 pb-2">
                <div class="w-12 h-12 rounded-full border-2 border-[#3d2b1f] bg-cover bg-center shrink-0 shadow-inner"
                     style="background-image: url('${raceImg}')"></div>
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <span class="font-bold text-lg medieval-font leading-tight">${char.name}${statusBadge}</span>
                        <span class="text-red-800 font-bold text-lg leading-none">${displayHp}/${maxHp}</span>
                    </div>
                    <div class="health-bar-bg mt-1">
                        <div class="health-bar-fill ${hpColor}" style="width: ${hpPercent}%"></div>
                    </div>
                    <small class="text-[10px] text-gray-600 uppercase font-bold tracking-tighter">
                        ${char.gender === 'F' ? '♀' : '♂'} ${char.race || ''} ${char.charClass || ''}
                    </small>
                </div>
            </div>

            <!-- Controles de HP en tiempo real -->
            <div class="flex items-center gap-1 mb-2 bg-black/10 rounded-lg p-1">
                <button onclick="quickHpChange(${char.id}, -1)"  class="bg-red-800 hover:bg-red-700 text-white text-xs font-bold w-6 h-6 rounded transition-colors flex items-center justify-center" title="-1 HP">-1</button>
                <button onclick="quickHpChange(${char.id}, -5)"  class="bg-red-900 hover:bg-red-800 text-white text-[9px] font-bold w-6 h-6 rounded transition-colors flex items-center justify-center" title="-5 HP">-5</button>
                <input  type="number" id="hpInput-${char.id}" placeholder="HP" class="flex-1 bg-white/30 border border-black/20 rounded text-center text-xs font-bold text-amber-900 h-6 outline-none min-w-0">
                <button onclick="applyCustomHp(${char.id}, -1)" class="bg-orange-700 hover:bg-orange-600 text-white text-[9px] font-bold px-1.5 h-6 rounded transition-colors" title="Aplicar daño">DMG</button>
                <button onclick="applyCustomHp(${char.id}, +1)" class="bg-green-700  hover:bg-green-600  text-white text-[9px] font-bold px-1.5 h-6 rounded transition-colors" title="Aplicar curación">CUR</button>
                <button onclick="quickHpChange(${char.id}, +5)"  class="bg-green-800 hover:bg-green-700 text-white text-[9px] font-bold w-6 h-6 rounded transition-colors flex items-center justify-center" title="+5 HP">+5</button>
                <button onclick="quickHpChange(${char.id}, +1)"  class="bg-green-600 hover:bg-green-500 text-white text-xs font-bold w-6 h-6 rounded transition-colors flex items-center justify-center" title="+1 HP">+1</button>
            </div>

            <div class="flex justify-between items-center mb-2">
                <div class="flex gap-2 bg-black/5 p-1.5 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity">
                    <button onclick="openInitModal(${char.id}, '${char.name}')" title="Iniciativa">🎲</button>
                    <button onclick="openEditModal(${charData})" title="Editar">✏️</button>
                    <button onclick="toggleDeath(${char.id})" title="Marcar Muerto">${char.isDead ? '❤️' : '💀'}</button>
                    <button onclick="openDeleteModal(${char.id})" class="text-red-800 font-bold" title="Eliminar">🗑️</button>
                </div>
                <div class="text-xs font-bold text-gray-500 bg-white/30 px-2 py-0.5 rounded-full">NVL ${char.level}</div>
            </div>

            <div class="grid grid-cols-6 gap-1 text-[9px] mb-2 font-bold text-center">
                <div class="stat-box">ST<br>${char.str}<span class="text-[8px] text-amber-700">${getModifier(char.str||10)}</span></div>
                <div class="stat-box">DX<br>${char.dex}<span class="text-[8px] text-amber-700">${getModifier(char.dex||10)}</span></div>
                <div class="stat-box">CN<br>${char.con}<span class="text-[8px] text-amber-700">${getModifier(char.con||10)}</span></div>
                <div class="stat-box">IN<br>${char.intel}<span class="text-[8px] text-amber-700">${getModifier(char.intel||10)}</span></div>
                <div class="stat-box">WS<br>${char.wis}<span class="text-[8px] text-amber-700">${getModifier(char.wis||10)}</span></div>
                <div class="stat-box">CH<br>${char.cha}<span class="text-[8px] text-amber-700">${getModifier(char.cha||10)}</span></div>
            </div>
            <p class="text-[10px] italic leading-tight text-gray-800 border-t border-black/5 pt-1">
                <b>${char.background || 'Nota'}:</b> ${char.description || ''}
            </p>
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
    document.getElementById('initiativeModal').classList.remove('hidden');
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
    list.innerHTML = "";
    combatOrder.forEach((char, index) => {
        list.innerHTML += `
            <div class="glass border-l-4 border-purple-500 p-3 rounded-xl flex justify-between items-center mb-2">
                <div class="flex items-center gap-3">
                    <span class="bg-purple-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">${index + 1}</span>
                    <span class="font-bold text-sm text-purple-200">${char.name}</span>
                </div>
                <span class="font-bold text-xl text-yellow-500">${char.total}</span>
            </div>`;
    });
}

// =============================================
// BITÁCORA
// =============================================

function addLog(message, color = 'white') {
    const log = document.getElementById('logEntries');
    const colors = { blue: 'text-blue-400', red: 'text-red-400', amber: 'text-amber-400', purple: 'text-purple-400', white: 'text-white/80' };
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const entry = document.createElement('div');
    entry.className = `p-2 border-b border-white/5 text-xs ${colors[color] || 'text-white/80'} log-entry`;
    entry.innerHTML = `<span class="opacity-30 mr-2">[${time}]</span> ${message}`;
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
    document.getElementById('editModal').classList.remove('hidden');
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
    currentDeleteId = id;
    document.getElementById('deleteModal').classList.remove('hidden');
    document.getElementById('confirmDeleteBtn').onclick = () => deleteChar(currentDeleteId);
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

function getBorderColor(type) {
    return type === 'MONSTRUO' ? 'border-red-900' : type === 'HEROE' ? 'border-blue-900' : 'border-amber-900';
}

function resetInvocacionForm() {
    ['charName', 'charClass', 'charBackground', 'charDesc'].forEach(id => {
        document.getElementById(id).value = "";
    });
    document.getElementById('racePreview').classList.add('hidden');
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

window.onscroll = function () {
    const btn = document.getElementById("backToTop");
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        btn.classList.remove("translate-y-20", "opacity-0");
    } else {
        btn.classList.add("translate-y-20", "opacity-0");
    }
};

function toggleDiceRoller() { document.getElementById('dicePanel').classList.toggle('hidden'); }
function toggleLog()         { document.getElementById('combatLogPanel').classList.toggle('hidden'); }
function closeEditModal()    { document.getElementById('editModal').classList.add('hidden'); }
function closeDeleteModal()  { document.getElementById('deleteModal').classList.add('hidden'); }
function closeInitModal()    { document.getElementById('initiativeModal').classList.add('hidden'); }
function clearInitiative()   { combatOrder = []; renderInitiative(); }
