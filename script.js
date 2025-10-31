// --- 1. DATA KARTU ---
const CARD_DATABASE = [
    { id: "BN001", name: "Zero-Knowledge Proof", type: "Defense", cost: 1, value: 30, description: "Menciptakan perisai pelindung. Memberikan 30 Shield.", rarity: "Common" },
    { id: "BN002", name: "AI Agent Attack", type: "Attack", cost: 2, value: 45, description: "Mengirim agen AI. Memberikan 45 Damage.", rarity: "Common" },
    { id: "BN003", name: "Data Optimization", type: "Utility", cost: 0, value: 2, description: "Mengoptimalkan dek. Tarik 2 Kartu tambahan.", rarity: "Rare" },
    { id: "BN004", name: "Community Consensus", type: "Utility", cost: 3, value: 15, description: "Menggalang kekuatan komunitas. +15 Shield dan +15 HP.", rarity: "Rare" },
    { id: "BN005", name: "51% Attack", type: "Attack", cost: 4, value: 100, description: "Serangan fatal. Memberikan 100 Damage.", rarity: "Legendary" },
    { id: "BN006", name: "Simple Patch", type: "Defense", cost: 0, value: 10, description: "Patch kecil. Memberikan 10 Shield.", rarity: "Common" }
];

// --- 2. VARIABEL GAME STATE ---
const MAX_MANA = 3;
const STARTING_HP = 100;
const HAND_SIZE_DRAW = 5;

let players = {
    1: { id: 1, name: "Player 1", hp: STARTING_HP, mana: MAX_MANA, shield: 0, deck: [], hand: [], discard: [] },
    2: { id: 2, name: "Player 2 (AI)", hp: STARTING_HP, mana: MAX_MANA, shield: 0, deck: [], hand: [], discard: [] }
};

let currentPlayer = 1;

// --- 3. DOM ELEMENTS ---
const dom = {
    p1Hp: document.getElementById('p1-hp'),
    p1Mana: document.getElementById('p1-mana'),
    p1Shield: document.getElementById('p1-shield'),
    p1Hand: document.getElementById('p1-hand'),

    p2Hp: document.getElementById('p2-hp'),
    p2Mana: document.getElementById('p2-mana'),
    p2Shield: document.getElementById('p2-shield'),
    p2Hand: document.getElementById('p2-hand'), // Kita tetap render meski AI
    
    turnIndicator: document.getElementById('turn-indicator'),
    endTurnBtn: document.getElementById('end-turn-btn'),
    gameLog: document.getElementById('game-log'),
};


// --- 4. FUNGSI UTILITAS GAME ---

/** Mengacak array (Fisher-Yates Shuffle) */
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/** Menulis pesan ke Log Game */
function log(message) {
    const p = document.createElement('p');
    p.textContent = `[P${currentPlayer}] ${message}`;
    dom.gameLog.prepend(p);
    // Batasi log agar tidak terlalu panjang
    while (dom.gameLog.children.length > 20) {
        dom.gameLog.removeChild(dom.gameLog.lastChild);
    }
}

/** Membuat Deck awal untuk pemain */
function createDeck() {
    let deck = [];
    // Contoh deck: 2x Legendary, 4x Rare, 6x Common
    CARD_DATABASE.forEach(card => {
        let count = 0;
        if (card.rarity === "Common") count = 6;
        if (card.rarity === "Rare") count = 4;
        if (card.rarity === "Legendary") count = 2;

        for (let i = 0; i < count; i++) {
            deck.push(card.id); // Simpan ID kartu saja
        }
    });
    shuffle(deck);
    return deck;
}

/** Mengupdate tampilan statistik di UI */
function updateStats() {
    dom.p1Hp.textContent = players[1].hp;
    dom.p1Mana.textContent = players[1].mana;
    dom.p1Shield.textContent = players[1].shield;

    dom.p2Hp.textContent = players[2].hp;
    dom.p2Mana.textContent = players[2].mana;
    dom.p2Shield.textContent = players[2].shield;
    
    dom.turnIndicator.textContent = `${players[currentPlayer].name}'s Turn`;
    
    renderHand();
}

/** Menggambar Kartu */
function drawCard(player, num = 1) {
    for (let i = 0; i < num; i++) {
        // Jika dek kosong, kocok ulang discard pile
        if (player.deck.length === 0) {
            if (player.discard.length === 0) {
                log(`${player.name} kehabisan kartu!`);
                return; // Tidak ada kartu lagi
            }
            player.deck = [...player.discard];
            player.discard = [];
            shuffle(player.deck);
            log(`${player.name} mengocok ulang discard pile!`);
        }
        
        const cardId = player.deck.pop();
        const card = CARD_DATABASE.find(c => c.id === cardId);
        player.hand.push(card);
    }
    log(`${player.name} menarik ${num} kartu.`);
}

/** Merender kartu di tangan pemain saat ini */
function renderHand() {
    const handElement = (currentPlayer === 1) ? dom.p1Hand : dom.p2Hand;
    const player = players[currentPlayer];
    handElement.innerHTML = '';
    
    player.hand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        const isPlayable = card.cost <= player.mana;
        
        cardElement.className = `card ${isPlayable ? 'playable' : 'disabled'}`;
        cardElement.innerHTML = `
            <div class="card-cost">${card.cost} Mana</div>
            <div class="card-title">${card.name}</div>
            <div class="card-type">${card.type}</div>
            <div class="card-description">${card.description}</div>
        `;
        
        cardElement.onclick = () => {
            if (currentPlayer === 1 && isPlayable) {
                playCard(player, index, card);
            } else if (currentPlayer === 2) {
                log("AI sedang berpikir...");
            } else if (!isPlayable) {
                log("Mana tidak cukup!");
            }
        };
        
        handElement.appendChild(cardElement);
    });
    
    // Pastikan tangan lawan (P2) disembunyikan jika dimainkan oleh P1
    if (currentPlayer === 1) {
        dom.p2Hand.innerHTML = 'Kartu Lawan Tersembunyi';
    } else {
        dom.p1Hand.innerHTML = 'Kartu Lawan Tersembunyi';
    }
}


// --- 5. LOGIKA GAME UTAMA ---

/** Memainkan Kartu */
function playCard(player, cardIndex, card) {
    const opponent = players[player.id === 1 ? 2 : 1];

    if (player.mana < card.cost) {
        log(`${player.name} tidak memiliki cukup Mana untuk memainkan ${card.name}!`);
        return false;
    }
    
    // 1. Kurangi Mana
    player.mana -= card.cost;
    log(`${player.name} memainkan ${card.name} (Cost: ${card.cost})`);

    // 2. Terapkan Efek Kartu
    switch (card.type) {
        case 'Attack':
            applyDamage(opponent, card.value);
            break;
        case 'Defense':
            player.shield += card.value;
            log(`${player.name} mendapatkan ${card.value} Shield.`);
            break;
        case 'Utility':
            if (card.name === 'Data Optimization') {
                drawCard(player, card.value); // value = 2
            } else if (card.name === 'Community Consensus') {
                player.shield += card.value;
                player.hp += card.value; // Heal
                log(`${player.name} mendapatkan ${card.value} Shield dan menyembuhkan ${card.value} HP.`);
            }
            break;
    }

    // 3. Pindahkan Kartu ke Discard Pile
    const playedCard = player.hand.splice(cardIndex, 1)[0];
    player.discard.push(playedCard.id);
    
    updateStats();
    checkGameOver();
    return true;
}

/** Mengaplikasikan Damage ke Pemain */
function applyDamage(target, damage) {
    let finalDamage = damage;
    
    if (target.shield > 0) {
        // Serap damage oleh shield
        const damageToShield = Math.min(target.shield, damage);
        target.shield -= damageToShield;
        finalDamage = damage - damageToShield;
        log(`Shield ${target.name} menyerap ${damageToShield} damage.`);
    }

    if (finalDamage > 0) {
        target.hp -= finalDamage;
    }

    log(`${target.name} menerima ${finalDamage} damage. Sisa HP: ${target.hp}.`);
}


/** Mengakhiri Giliran */
function endTurn() {
    // 1. Bersihkan sisa kartu di tangan ke discard pile (optional, tergantung ruleset)
    // Di game ini, kartu tetap di tangan.

    // 2. Ganti Pemain
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    
    // 3. Reset Mana, Bersihkan Shield
    players[currentPlayer].mana = MAX_MANA;
    players[currentPlayer].shield = 0;
    
    log(`--- Giliran ${players[currentPlayer].name} dimulai! ---`);
    
    // 4. Tarik kartu baru
    drawCard(players[currentPlayer], 2); // Setiap turn tarik 2 kartu

    updateStats();

    // Jika giliran AI, panggil fungsi AI
    if (currentPlayer === 2) {
        setTimeout(aiTurn, 1000); // Tunda sebentar agar terlihat 'berpikir'
    }
}

/** Logika AI Sederhana (Player 2) */
function aiTurn() {
    const aiPlayer = players[2];
    const opponent = players[1];
    let cardsPlayed = 0;

    log("AI sedang menentukan langkah...");

    // Strategi AI Sederhana:
    // 1. Jika HP < 40, prioritaskan Defense/Heal
    // 2. Jika HP OK, prioritaskan Attack dengan Cost terbaik.
    
    let playableCards = aiPlayer.hand.filter(card => card.cost <= aiPlayer.mana);
    
    // Loop dan mainkan kartu selama masih ada Mana yang bisa digunakan
    while (playableCards.length > 0 && aiPlayer.mana > 0) {
        let bestCardIndex = -1;
        let bestCardScore = -1;
        
        playableCards.forEach((card, index) => {
            let score = 0;
            
            // Prioritas 1: Defense jika HP rendah
            if (aiPlayer.hp < 40 && card.type === 'Defense') {
                score += card.value * 2; // Nilai tinggi untuk defense
            }
            
            // Prioritas 2: Attack
            if (card.type === 'Attack') {
                score += card.value / card.cost; // Prioritas Attack yang cost-nya murah
            }
            
            // Prioritas 3: Utility (hanya jika cost 0)
            if (card.type === 'Utility' && card.cost === 0) {
                score += 50;
            }

            if (score > bestCardScore) {
                bestCardScore = score;
                bestCardIndex = index;
            }
        });

        if (bestCardIndex !== -1) {
             const cardToPlay = playableCards[bestCardIndex];
             // Cari index cardToPlay di aiPlayer.hand
             const actualIndex = aiPlayer.hand.findIndex(c => c.id === cardToPlay.id);
             
             playCard(aiPlayer, actualIndex, cardToPlay);
             cardsPlayed++;
             
             // Update playable cards
             playableCards = aiPlayer.hand.filter(card => card.cost <= aiPlayer.mana);
             
        } else {
            // Jika tidak ada kartu 'terbaik' lagi, hentikan
            break;
        }
    }
    
    log(`AI memainkan ${cardsPlayed} kartu.`);
    
    // Akhiri giliran AI
    if (!checkGameOver()) {
        setTimeout(endTurn, 1500); // Tunda lagi sebelum turn P1
    }
}

/** Pengecekan Game Over */
function checkGameOver() {
    if (players[1].hp <= 0) {
        log(`GAME OVER! ${players[2].name} Menang!`);
        disableGame();
        return true;
    }
    if (players[2].hp <= 0) {
        log(`GAME OVER! ${players[1].name} Menang!`);
        disableGame();
        return true;
    }
    return false;
}

/** Menonaktifkan game setelah selesai */
function disableGame() {
    dom.endTurnBtn.disabled = true;
    dom.p1Hand.innerHTML = '<p style="text-align:center;">Game Berakhir</p>';
    dom.p2Hand.innerHTML = '<p style="text-align:center;">Game Berakhir</p>';
}

/** Inisialisasi Game */
function initGame() {
    // 1. Buat Deck
    players[1].deck = createDeck();
    players[2].deck = createDeck();
    
    // 2. Tarik Kartu Awal (5 kartu)
    drawCard(players[1], HAND_SIZE_DRAW);
    drawCard(players[2], HAND_SIZE_DRAW);

    // 3. Atur Giliran Awal
    currentPlayer = 1;
    log("Game Dimulai! Player 1 mulai.");

    // 4. Update UI
    updateStats();

    // 5. Setup Listener
    dom.endTurnBtn.onclick = endTurn;
}


// --- RUN THE GAME ---
initGame();
