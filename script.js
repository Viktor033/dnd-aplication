/**
 * DM ENGINE - ELITE EDITION 5.5
 * Victor Duarte - Lógica Avanzada de Gestión de Campaña
 */

const API_BASE = "http://localhost:8080";
let allCharacters = [];
let combatOrder = []; 
let previousLevel = 1;
let currentInitId = null;

// --- DICCIONARIO DE IMÁGENES ---
const raceGallery = {
    "Human": {
        "M": "https://www.dndbeyond.com/avatars/thumbnails/6/256/420/618/636271780799451982.jpeg",
        "F": "https://www.dndbeyond.com/avatars/thumbnails/6/257/420/618/636271781267451352.jpeg"
    },
    "Elf": {
        "M": "https://www.dndbeyond.com/avatars/thumbnails/6/284/420/618/636272035279569304.jpeg",
        "F": "https://www.dndbeyond.com/avatars/thumbnails/6/285/420/618/636272036234310574.jpeg"
    },
    "Dwarf": {
        "M": "https://www.dndbeyond.com/avatars/thumbnails/6/254/420/618/636271780222891984.jpeg",
        "F": "https://www.dndbeyond.com/avatars/thumbnails/6/255/420/618/636271781031302302.jpeg"
    },
    "Orc": {
        "M": "https://www.dndbeyond.com/avatars/thumbnails/30845/428/420/618/638042125345719365.png",
        "F": "https://www.dndbeyond.com/avatars/thumbnails/30845/429/420/618/638042125796245138.png"
    },
    "Tiefling": {
        "M": "https://www.dndbeyond.com/avatars/thumbnails/7/7/420/618/636272322449445694.jpeg",
        "F": "https://www.dndbeyond.com/avatars/thumbnails/7/8/420/618/636272323067251351.jpeg"
    },
    "Dragonborn": {
        "M": "https://www.dndbeyond.com/avatars/thumbnails/6/258/420/618/636271801914013318.jpeg",
        "F": "https://www.dndbeyond.com/avatars/thumbnails/6/259/420/618/636271802513264405.jpeg"
    },
    "Gnome": {
        "M": "https://www.dndbeyond.com/avatars/thumbnails/6/334/420/618/636272635395992331.jpeg",
        "F": "https://www.dndbeyond.com/avatars/thumbnails/6/335/420/618/636272636306540671.jpeg"
    },
    "Halfling": {
        "M": "https://www.dndbeyond.com/avatars/thumbnails/6/256/420/618/636271780799451982.jpeg", 
        "F": "https://www.dndbeyond.com/avatars/thumbnails/6/255/420/618/636271781031302302.jpeg"
    },
    "Fairy": { "M": "https://www.dndbeyond.com/avatars/thumbnails/20472/380/420/618/637677404805539504.png", "F": "https://www.dndbeyond.com/avatars/thumbnails/20472/380/420/618/637677404805539504.png" },
    "Shifter": { "M": "https://www.dndbeyond.com/avatars/thumbnails/7766/315/420/618/637120300127583445.png", "F": "https://www.dndbeyond.com/avatars/thumbnails/7766/315/420/618/637120300127583445.png" },
    "Warforged": { "M": "https://www.dndbeyond.com/avatars/thumbnails/7766/317/420/618/637120300185938479.png", "F": "https://www.dndbeyond.com/avatars/thumbnails/7766/317/420/618/637120300185938479.png" },
    "Goliath": { "M": "https://www.dndbeyond.com/avatars/thumbnails/30845/419/420/618/638042123530752112.png", "F": "https://www.dndbeyond.com/avatars/thumbnails/30845/420/420/618/638042123984166286.png" },
    "Aasimar": { "M": "https://www.dndbeyond.com/avatars/thumbnails/30845/407/420/618/638042121020786522.png", "F": "https://www.dndbeyond.com/avatars/thumbnails/30845/408/420/618/638042121469032731.png" }
};

window.onload = fetchCharacters;

// --- UTILIDADES DE IMAGEN ---
function updateRacePreview(containerId, race) {
    const gender = containerId === 'racePreview' ? document.getElementById('charGender').value : document.getElementById('editGender').value;
    const container = document.getElementById(containerId);
    
    if (race && raceGallery[race]) {
        const imgUrl = raceGallery[race][gender] || raceGallery[race]["M"];
        container.style.backgroundImage = `url('${imgUrl}')`;
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

// --- CRUD PRINCIPAL ---
async function fetchCharacters() {
    try {
        const response = await fetch(`${API_BASE}/characters`);
        allCharacters = await response.json();
        renderAll();
    } catch (error) { console.error("Error cargando personajes", error); }
}

async function saveCharacter() {
    const character = {
        name: document.getElementById('charName').value,
        race: document.getElementById('charRace').value,
        gender: document.getElementById('charGender').value,
        charClass: document.getElementById('charClass').value,
        background: document.getElementById('charBackground').value,
        alignment: document.getElementById('charAlignment').value,
        type: document.getElementById('charCategory').value,
        level: parseInt(document.getElementById('charLevel').value) || 1,
        hp: parseInt(document.getElementById('charHp').value) || 0,
        str: parseInt(document.getElementById('charStr').value) || 10,
        dex: parseInt(document.getElementById('charDex').value) || 10,
        con: parseInt(document.getElementById('charCon').value) || 10,
        intel: parseInt(document.getElementById('charInt').value) || 10,
        wis: parseInt(document.getElementById('charWis').value) || 10,
        cha: parseInt(document.getElementById('charCha').value) || 10,
        description: document.getElementById('charDesc').value
    };

    if(!character.name) return alert("Nombre requerido");

    try {
        const response = await fetch(`${API_BASE}/characters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(character)
        });
        if(response.ok) { 
            fetchCharacters(); 
            resetInvocacionForm(); 
            addLog(`Aventurero ${character.name} forjado con éxito.`, 'blue');
        }
    } catch (error) { alert("Error al conectar"); }
}

function renderAll() {
    const lists = { MONSTRUO: 'monsterList', HEROE: 'heroList', NPC: 'npcList' };
    const counts = { MONSTRUO: 0, HEROE: 0, NPC: 0 };
    
    Object.values(lists).forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerHTML = "";
    });

    allCharacters.forEach(char => {
        const listId = lists[char.type] || 'npcList';
        const targetList = document.getElementById(listId);
        if(targetList) {
            targetList.innerHTML += createCard(char);
            counts[char.type]++;
        }
    });

    updateCounters(counts);
}

function createCard(char) {
    const charData = JSON.stringify(char).replace(/"/g, '&quot;');
    const raceData = raceGallery[char.race] || null;
    const raceImg = raceData ? (raceData[char.gender] || raceData["M"]) : "";
    
    // Health bar logic (Assuming max HP is the same as current for new chars, or stored)
    // For now we just use a full bar or relative to a fixed value
    const healthPercent = 100; // Placeholder for real health tracking

    return `
        <div id="card-${char.id}" class="parchment p-4 rounded-xl shadow-lg border-l-8 ${getBorderColor(char.type)} group" data-name="${char.name.toLowerCase()}">
            <div class="flex gap-3 border-b border-black/10 mb-2 pb-2">
                <div class="w-12 h-12 rounded-full border-2 border-[#3d2b1f] bg-cover bg-center shrink-0 shadow-inner" 
                     style="background-image: url('${raceImg}')"></div>
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <span class="font-bold text-lg medieval-font leading-tight">${char.name}</span>
                        <span class="text-red-800 font-bold text-lg leading-none">${char.hp}</span>
                    </div>
                    <div class="health-bar-bg mt-1">
                        <div class="health-bar-fill bg-red-600" style="width: ${healthPercent}%"></div>
                    </div>
                    <small class="text-[10px] text-gray-600 uppercase font-bold tracking-tighter">
                        ${char.gender === 'F' ? '♀' : '♂'} ${char.race || ''} ${char.charClass || ''} | ${char.alignment || ''}
                    </small>
                </div>
            </div>
            
            <div class="flex justify-between items-center mb-2">
                <div class="flex gap-2 bg-black/5 p-1.5 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity">
                    <button onclick="openInitModal(${char.id}, '${char.name}')" class="hover:scale-125 transition-transform" title="Iniciativa">🎲</button>
                    <button onclick="openEditModal(${charData})" class="hover:scale-125 transition-transform" title="Editar">✏️</button>
                    <button onclick="toggleDeath(${char.id})" class="hover:scale-125 transition-transform" title="Estado">💀</button>
                    <button onclick="openDeleteModal(${char.id})" class="hover:scale-125 transition-transform" title="Eliminar">🗑️</button>
                </div>
                <div class="text-xs font-bold text-gray-500 bg-white/30 px-2 py-0.5 rounded-full">NVL ${char.level}</div>
            </div>

            <div class="grid grid-cols-6 gap-1 text-[9px] mb-2 font-bold text-center">
                <div class="stat-box">ST<br>${char.str}</div>
                <div class="stat-box">DX<br>${char.dex}</div>
                <div class="stat-box">CN<br>${char.con}</div>
                <div class="stat-box">IN<br>${char.intel}</div>
                <div class="stat-box">WS<br>${char.wis}</div>
                <div class="stat-box">CH<br>${char.cha}</div>
            </div>
            <p class="text-[10px] italic leading-tight text-gray-800 border-t border-black/5 pt-1">
                <b>${char.background || 'Nota'}:</b> ${char.description || ''}
            </p>
        </div>
    `;
}

// --- GESTIÓN DE COMBATE ---
function openInitModal(id, name) {
    currentInitId = id;
    document.getElementById('initModalName').innerText = name;
    document.getElementById('manualRoll').value = "";
    document.getElementById('initiativeModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('manualRoll').focus(), 100);
}

function confirmManualInitiative() {
    const val = parseInt(document.getElementById('manualRoll').value);
    if (isNaN(val)) return alert("Ingresa el valor");

    const name = document.getElementById('initModalName').innerText;
    combatOrder = combatOrder.filter(c => c.id !== currentInitId);
    combatOrder.push({ id: currentInitId, name: name, total: val });

    combatOrder.sort((a, b) => b.total - a.total);
    renderInitiative();
    closeInitModal();
    addLog(`${name} entró en combate con iniciativa ${val}`, 'purple');
}

function renderInitiative() {
    const list = document.getElementById('initiativeList');
    if(!list) return;
    list.innerHTML = "";
    combatOrder.forEach((char, index) => {
        list.innerHTML += `
            <div class="glass border-l-4 border-purple-500 p-3 rounded-xl flex justify-between items-center mb-2 animate-fade-in">
                <div class="flex items-center gap-3">
                    <span class="bg-purple-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">${index + 1}</span>
                    <span class="font-bold text-sm text-purple-200">${char.name}</span>
                </div>
                <span class="font-bold text-xl text-yellow-500 drop-shadow-sm">${char.total}</span>
            </div>
        `;
    });
}

// --- LANZADOR DE DADOS ---
function toggleDiceRoller() {
    const panel = document.getElementById('dicePanel');
    panel.classList.toggle('hidden');
}

function rollDice(faces) {
    const result = Math.floor(Math.random() * faces) + 1;
    const display = document.getElementById('diceResult').querySelector('span');
    
    // Animación de rodado
    let counter = 0;
    const interval = setInterval(() => {
        display.innerText = Math.floor(Math.random() * faces) + 1;
        counter++;
        if(counter > 10) {
            clearInterval(interval);
            display.innerText = result;
            addLog(`Resultado d${faces}: ${result}`, 'amber');
        }
    }, 50);
}

// --- BITÁCORA ---
function toggleLog() {
    document.getElementById('combatLogPanel').classList.toggle('hidden');
}

function addLog(message, color = 'white') {
    const log = document.getElementById('logEntries');
    const colors = {
        white: 'text-white/80',
        blue: 'text-blue-400',
        red: 'text-red-400',
        amber: 'text-amber-400',
        purple: 'text-purple-400'
    };
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const entry = document.createElement('div');
    entry.className = `log-entry p-2 border-b border-white/5 text-xs ${colors[color]}`;
    entry.innerHTML = `<span class="opacity-30 mr-2">[${time}]</span> ${message}`;
    log.prepend(entry);
}

// --- MODALES Y EDICIÓN ---
function openEditModal(char) {
    previousLevel = parseInt(char.level) || 1;
    document.getElementById('editId').value = char.id;
    document.getElementById('editName').value = char.name;
    document.getElementById('editRace').value = char.race || "";
    document.getElementById('editGender').value = char.gender || "M";
    document.getElementById('editClass').value = char.charClass || "";
    document.getElementById('editBackground').value = char.background || "";
    document.getElementById('editLevel').value = char.level;
    document.getElementById('editHp').value = char.hp;
    document.getElementById('editStr').value = char.str;
    document.getElementById('editDex').value = char.dex;
    document.getElementById('editCon').value = char.con;
    document.getElementById('editInt').value = char.intel;
    document.getElementById('editWis').value = char.wis;
    document.getElementById('editCha').value = char.cha;
    document.getElementById('editDesc').value = char.description;
    
    updateRacePreview('editRacePreview', char.race);
    document.getElementById('editModal').classList.remove('hidden');
}

async function updateCharacter() {
    const newLevel = parseInt(document.getElementById('editLevel').value) || 1;
    const character = {
        id: document.getElementById('editId').value,
        name: document.getElementById('editName').value,
        race: document.getElementById('editRace').value,
        gender: document.getElementById('editGender').value,
        charClass: document.getElementById('editClass').value,
        background: document.getElementById('editBackground').value,
        level: newLevel,
        hp: parseInt(document.getElementById('editHp').value),
        str: parseInt(document.getElementById('editStr').value),
        dex: parseInt(document.getElementById('editDex').value),
        con: parseInt(document.getElementById('editCon').value),
        intel: parseInt(document.getElementById('editInt').value),
        wis: parseInt(document.getElementById('editWis').value),
        cha: parseInt(document.getElementById('editCha').value),
        description: document.getElementById('editDesc').value,
        type: document.getElementById('editCategory')?.value || allCharacters.find(c => c.id == document.getElementById('editId').value).type
    };

    try {
        const response = await fetch(`${API_BASE}/characters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(character)
        });
        if(response.ok) {
            closeEditModal();
            fetchCharacters();
            if (newLevel > previousLevel) showLevelUpModal();
            addLog(`Ficha de ${character.name} actualizada.`, 'blue');
        }
    } catch (error) { alert("Error al actualizar"); }
}

// --- EXTRAS ---
function showLevelUpModal() {
    const modal = document.getElementById('levelUpModal');
    if(modal) {
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('hidden'), 3500);
    }
}

function getBorderColor(type) {
    if (type === 'MONSTRUO') return 'border-red-900';
    if (type === 'HEROE') return 'border-blue-900';
    return 'border-amber-900';
}

function updateCounters(counts) {
    if(document.getElementById('countMonsters')) document.getElementById('countMonsters').innerText = counts.MONSTRUO;
    if(document.getElementById('countHeroes')) document.getElementById('countHeroes').innerText = counts.HEROE;
    if(document.getElementById('countNPCs')) document.getElementById('countNPCs').innerText = counts.NPC;
}

function filterList(listId, query) {
    const list = document.getElementById(listId);
    const cards = list.getElementsByClassName('parchment');
    const q = query.toLowerCase();
    for (let card of cards) {
        card.style.display = card.getAttribute('data-name').includes(q) ? "block" : "none";
    }
}

function closeEditModal() { document.getElementById('editModal').classList.add('hidden'); }
function closeDeleteModal() { document.getElementById('deleteModal').classList.add('hidden'); }
function closeInitModal() { document.getElementById('initiativeModal').classList.add('hidden'); }
function toggleDeath(id) { 
    const card = document.getElementById(`card-${id}`);
    card?.classList.toggle('opacity-40'); 
    card?.classList.toggle('grayscale');
    addLog(`Estado de personaje ${id} alterado.`, 'red');
}
function clearInitiative() { 
    combatOrder = []; 
    renderInitiative(); 
    addLog("Orden de iniciativa reiniciado.", 'purple');
}
function openDeleteModal(id) { 
    currentInitId = id; 
    document.getElementById('deleteModal').classList.remove('hidden'); 
    document.getElementById('confirmDeleteBtn').onclick = () => deleteChar(currentInitId); 
}

async function deleteChar(id) {
    try {
        await fetch(`${API_BASE}/characters/${id}`, { method: 'DELETE' });
        closeDeleteModal();
        fetchCharacters();
        addLog(`Personaje eliminado del registro.`, 'red');
    } catch (error) { alert("Error"); }
}

function resetInvocacionForm() {
    document.getElementById('charName').value = "";
    document.getElementById('charClass').value = "";
    document.getElementById('charBackground').value = "";
    document.getElementById('charDesc').value = "";
    document.getElementById('racePreview').classList.add('hidden');
}