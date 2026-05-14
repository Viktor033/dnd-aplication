/**
 * DM ENGINE - ELITE DEMO (Pure Frontend Edition)
 * Victor Duarte - Gestión de Campaña sin Servidor
 */

// --- ESTADO GLOBAL ---
let allCharacters = JSON.parse(localStorage.getItem('dm_engine_chars')) || [];
let combatOrder = []; 
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

window.onload = () => {
    renderAll();
    addLog("Motor Elite cargado en modo Local Storage", 'blue');
};

// --- SINCRONIZACIÓN Y RENDER ---
function sync() {
    localStorage.setItem('dm_engine_chars', JSON.stringify(allCharacters));
    renderAll();
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

// --- CRUD ---
function saveCharacter() {
    const character = {
        id: Date.now(),
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

    if(!character.name) return alert("¡Por el martillo de Moradin! Necesitas un nombre.");

    allCharacters.push(character);
    sync();
    resetInvocacionForm();
    addLog(`Nuevo aventurero: ${character.name}`, 'blue');
}

function updateCharacter() {
    const id = parseInt(document.getElementById('editId').value);
    const index = allCharacters.findIndex(c => c.id === id);
    
    if(index !== -1) {
        allCharacters[index] = {
            ...allCharacters[index],
            name: document.getElementById('editName').value,
            race: document.getElementById('editRace').value,
            gender: document.getElementById('editGender').value,
            charClass: document.getElementById('editClass').value,
            level: parseInt(document.getElementById('editLevel').value),
            hp: parseInt(document.getElementById('editHp').value),
            str: parseInt(document.getElementById('editStr').value),
            dex: parseInt(document.getElementById('editDex').value),
            con: parseInt(document.getElementById('editCon').value),
            intel: parseInt(document.getElementById('editInt').value),
            wis: parseInt(document.getElementById('editWis').value),
            cha: parseInt(document.getElementById('editCha').value),
            description: document.getElementById('editDesc').value
        };
        sync();
        closeEditModal();
        addLog(`Ficha de ${allCharacters[index].name} actualizada.`, 'amber');
    }
}

function deleteChar(id) {
    allCharacters = allCharacters.filter(c => c.id !== id);
    sync();
    closeDeleteModal();
    addLog(`Entidad eliminada del registro.`, 'red');
}

// --- RESTO DE FUNCIONES (DADOS, LOG, UI) ---
function createCard(char) {
    const charData = JSON.stringify(char).replace(/"/g, '&quot;');
    const raceData = raceGallery[char.race] || null;
    const raceImg = raceData ? (raceData[char.gender] || raceData["M"]) : "";
    
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
                    <div class="health-bar-bg mt-1"><div class="health-bar-fill bg-red-600" style="width: 100%"></div></div>
                    <small class="text-[10px] text-gray-600 uppercase font-bold tracking-tighter">
                        ${char.gender === 'F' ? '♀' : '♂'} ${char.race || ''} ${char.charClass || ''}
                    </small>
                </div>
            </div>
            
            <div class="flex justify-between items-center mb-2">
                <div class="flex gap-2 bg-black/5 p-1.5 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity">
                    <button onclick="openInitModal(${char.id}, '${char.name}')" title="Iniciativa">🎲</button>
                    <button onclick="openEditModal(${charData})" title="Editar">✏️</button>
                    <button onclick="toggleDeath(${char.id})" title="Estado">💀</button>
                    <button onclick="openDeleteModal(${char.id})" title="Eliminar">🗑️</button>
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

function rollDice(faces) {
    const result = Math.floor(Math.random() * faces) + 1;
    const display = document.getElementById('diceResult').querySelector('span');
    let counter = 0;
    const interval = setInterval(() => {
        display.innerText = Math.floor(Math.random() * faces) + 1;
        if(++counter > 10) {
            clearInterval(interval);
            display.innerText = result;
            addLog(`Resultado d${faces}: ${result}`, 'amber');
        }
    }, 50);
}

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

function addLog(message, color = 'white') {
    const log = document.getElementById('logEntries');
    const colors = { blue: 'text-blue-400', red: 'text-red-400', amber: 'text-amber-400', purple: 'text-purple-400', white: 'text-white/80' };
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const entry = document.createElement('div');
    entry.className = `p-2 border-b border-white/5 text-xs ${colors[color]}`;
    entry.innerHTML = `<span class="opacity-30 mr-2">[${time}]</span> ${message}`;
    log.prepend(entry);
}

// --- UTILS ---
function updateRacePreview(containerId, race) {
    const gender = containerId === 'racePreview' ? document.getElementById('charGender').value : document.getElementById('editGender').value;
    const container = document.getElementById(containerId);
    if (race && raceGallery[race]) {
        container.style.backgroundImage = `url('${raceGallery[race][gender] || raceGallery[race]["M"]}')`;
        container.classList.remove('hidden');
    } else container.classList.add('hidden');
}

// --- SCROLL Y UI EXTRAS ---
window.onscroll = function() {
    const btn = document.getElementById("backToTop");
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        btn.classList.remove("translate-y-20", "opacity-0");
    } else {
        btn.classList.add("translate-y-20", "opacity-0");
    }
};

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleDiceRoller() { document.getElementById('dicePanel').classList.toggle('hidden'); }
function toggleLog() { document.getElementById('combatLogPanel').classList.toggle('hidden'); }
function closeEditModal() { document.getElementById('editModal').classList.add('hidden'); }
function closeDeleteModal() { document.getElementById('deleteModal').classList.add('hidden'); }
function closeInitModal() { document.getElementById('initiativeModal').classList.add('hidden'); }
function toggleDeath(id) { document.getElementById(`card-${id}`)?.classList.toggle('opacity-40'); }
function clearInitiative() { combatOrder = []; renderInitiative(); }
function openDeleteModal(id) { currentInitId = id; document.getElementById('deleteModal').classList.remove('hidden'); document.getElementById('confirmDeleteBtn').onclick = () => deleteChar(currentInitId); }
function updateCounters(counts) { 
    ['countMonsters', 'countHeroes', 'countNPCs'].forEach(id => {
        const key = id.replace('count', '').replace('s', '').toUpperCase();
        if(document.getElementById(id)) document.getElementById(id).innerText = counts[key] || 0;
    });
}
function filterList(listId, query) {
    const list = document.getElementById(listId);
    const cards = list.getElementsByClassName('parchment');
    const q = query.toLowerCase();
    for (let card of cards) card.style.display = card.getAttribute('data-name').includes(q) ? "block" : "none";
}
function getBorderColor(type) { return type === 'MONSTRUO' ? 'border-red-900' : type === 'HEROE' ? 'border-blue-900' : 'border-amber-900'; }
function resetInvocacionForm() {
    ['charName', 'charClass', 'charBackground', 'charDesc'].forEach(id => document.getElementById(id).value = "");
    document.getElementById('racePreview').classList.add('hidden');
}

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
    document.getElementById('editDesc').value = char.description;
    updateRacePreview('editRacePreview', char.race);
    document.getElementById('editModal').classList.remove('hidden');
}