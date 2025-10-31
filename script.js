// ====================================================================
// Billions Battle Card Game - Logic
// ====================================================================

// --- 1. DATA KARTU ---
const CARD_DATABASE = [
    { id: "BN001", name: "Zero-Knowledge Proof", type: "Defense", cost: 1, value: 30, description: "Menciptakan perisai anonim. Memberikan 30 Shield.", rarity: "Common" },
    { id: "BN002", name: "AI Agent Attack", type: "Attack", cost: 2, value: 45, description: "Mengirim agen AI. Memberikan 45 Damage.", rarity: "Common" },
    { id: "BN003", name: "Data Optimization", type: "Utility", cost: 0, value: 2, description: "Mengoptimalkan dek. Tarik 2 Kartu tambahan.", rarity: "Rare" },
    { id: "BN004", name: "Community Consensus", type: "Utility", cost: 3, value: 15, description: "Menggalang kekuatan komunitas. +15 Shield dan +15 HP.", rarity: "Rare" },
    { id: "BN005", name: "51% Attack", type: "Attack", cost: 4, value: 100, description: "Serangan fatal. Memberikan 100 Damage.", rarity: "Legendary" },
    { id: "BN006", name: "Simple Patch", type: "Defense", cost: 0, value: 10, description: "Patch kecil. Memberikan 10 Shield.", rarity: "Common" }
];

// --- 2. KONFIGURASI GAME ---
const MAX_MANA = 3;
const STARTING_HP = 100;
const HAND_SIZE_DRAW_START = 7; // Kartu yang ditarik di awal
const HAND_SIZE_DRAW_TURN = 2;   // Kartu yang ditarik setiap giliran

let players = {
    1: { id: 1, name: "Player 1", hp: STARTING_HP, mana: MAX_MANA, shield: 0, deck: [], hand: [], discard: [] },
    2: { id: 2, name: "Player 2 (AI)", hp: STARTING_HP, mana: MAX_MANA, shield: 0, deck: [], hand: [], discard: [] }
};

let currentPlayer = 1;


// --- 3. DOM ELEMENTS ---
const dom = {
    turnIndicator: document.getElementById('turn-indicator'),
    endTurnBtn: document.getElementById('end-turn-btn'),
    gameLog: document.getElementById('game-log'),
    p1Hand: document.getElementById('p1-hand'),
    p2Hand: document.getElementById('p2-hand'),
};


// ====================================================================
// 4. FUNGSI UTILITAS DASAR
// ====================================================================

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

/** Membuat Deck awal */
function createDeck() {
    let deck = [];
    // 2x Legendary, 4x Rare, 6x Common (x2 set untuk menambah ukuran deck)
    CARD_DATABASE.forEach(card => {
        let count = 0;
        if (card.rarity === "Common") count = 12; // 2x6
        if (card.rarity === "Rare") count = 8;    // 2x4
        if (card.rarity === "Legendary") count = 4; // 2x2

        for (let i = 0; i < count; i++) {
            deck.push(card.id); // Simpan ID kartu saja
        }
    });
    shuffle(deck);
    return deck;
}


// ====================================================================
// 5. FUNGSI UPDATE UI
// ====================================================================

/** Mengupdate tampilan statistik untuk player tertentu */
function updatePlayerStats(playerId) {
    const player = players[playerId];
    const prefix = playerId === 1 ? 'p1' : 'p2';

    document.getElementById(`${prefix}-hp`).textContent = player.hp;
    document.getElementById(`${prefix}-mana`).textContent = `${player.mana}`;
    document.getElementById(`${prefix}-shield`).textContent = player.shield;
}

/** Mengupdate semua UI terkait stats dan turn */
function updateUI() {
    updatePlayerStats(1);
    updatePlayerStats(2);
    
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
                return; 
            }
            player.deck = [...player.discard];
            player.discard = [];
            shuffle(player.deck);
            log(`${player.name} mengocok ulang discard pile!`);
        }
        
        const cardId = player.deck.pop();
        const card = CARD_DATABASE.find(c => c.id === cardId);
        if (card) {
             player.hand.push(card);
        }
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
        
        cardElement.setAttribute('data-type', card.type); 
        
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
                log("Bukan giliran Anda! AI sedang berpikir.");
            } else if (!isPlayable) {
                log("Mana tidak cukup untuk kartu ini!");
            }
        };
        
        handElement.appendChild(cardElement);
    });
    
    // Sembunyikan tangan lawan
    if (currentPlayer === 1) {
        dom.p2Hand.innerHTML = '<p class="opponent-text">Kartu Lawan Tersembunyi</p>';
    } else {
        dom.p1Hand.innerHTML = '<p class="opponent-text">Kartu Lawan Tersembunyi</p>';
    }
}


// ====================================================================
// 6. LOGIKA GAME UTAMA
// ====================================================================

/** Memainkan Kartu */
function playCard(player, cardIndex, card) {
    const opponent = players[player.id === 1 ? 2 : 1];

    if (player.mana < card.cost) {
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
                drawCard(player, card.value); 
            } else if (card.name === 'Community Consensus') {
                player.shield += card.value;
                player.hp = Math.min(STARTING_HP, player.hp + card.value); // Heal, max HP 100
                log(`${player.name} mendapatkan ${card.value} Shield dan menyembuhkan ${card.value} HP.`);
            }
            break;
    }

    // 3. Pindahkan Kartu ke Discard Pile
    const playedCard = player.hand.splice(cardIndex, 1)[0];
    player.discard.push(playedCard.id);
    
    updateUI();
    checkGameOver();
    return true;
}

/** Mengaplikasikan Damage ke Pemain */
function applyDamage(target, damage) {
    let finalDamage = damage;
    
    if (target.shield > 0) {
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
    // 1. Ganti Pemain
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    
    // 2. Reset Mana, Bersihkan Shield
    players[currentPlayer].mana = MAX_MANA;
    players[currentPlayer].shield = 0;
    
    log(`--- Giliran ${players[currentPlayer].name} dimulai! ---`);
    
    // 3. Tarik kartu baru
    drawCard(players[currentPlayer], HAND_SIZE_DRAW_TURN);

    updateUI();

    // Jika giliran AI, panggil fungsi AI
    if (currentPlayer === 2) {
        dom.endTurnBtn.disabled = true; // Disable tombol saat AI berjalan
        setTimeout(aiTurn, 1000); 
    } else {
        dom.endTurnBtn.disabled = false; // Enable tombol saat giliran P1
    }
}

/** Logika AI Sederhana (Player 2) */
function aiTurn() {
    const aiPlayer = players[2];
    let cardsPlayed = 0;

    log("AI sedang menentukan langkah...");

    // Loop dan mainkan kartu selama masih ada Mana yang bisa digunakan
    let playableCards;
    
    const playNextCard = () => {
        playableCards = aiPlayer.hand.filter(card => card.cost <= aiPlayer.mana);

        if (playableCards.length === 0 || aiPlayer.mana === 0) {
            log(`AI selesai memainkan kartu.`);
            if (!checkGameOver()) {
                setTimeout(endTurn, 1500); 
            }
            return;
        }

        // Cari kartu terbaik (Strategi sederhana: prioritaskan Attack, lalu Utility cost 0, lalu Defense)
        playableCards.sort((a, b) => {
            if (b.type === 'Attack' && a.type !== 'Attack') return 1;
            if (b.type === 'Defense' && a.type === 'Utility') return -1;
            return b.cost - a.cost; // Prioritas cost tertinggi (untuk menghabiskan mana)
        });

        const cardToPlay = playableCards[0];
        const actualIndex = aiPlayer.hand.findIndex(c => c.id === cardToPlay.id);
        
        playCard(aiPlayer, actualIndex, cardToPlay);
        cardsPlayed++;
        
        // Jeda sebentar sebelum memainkan kartu berikutnya (Game Feel)
        setTimeout(playNextCard, 700);
    };

    playNextCard();
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
    dom.p1Hand.innerHTML = '<p style="text-align:center; color:#e74c3c;">Game Berakhir</p>';
    dom.p2Hand.innerHTML = '<p style="text-align:center; color:#e74c3c;">Game Berakhir</p>';
}

/** Inisialisasi Game */
function initGame() {
    // 1. Buat Deck
    players[1].deck = createDeck();
    players[2].deck = createDeck();
    
    // 2. Tarik Kartu Awal (7 kartu)
    drawCard(players[1], HAND_SIZE_DRAW_START);
    drawCard(players[2], HAND_SIZE_DRAW_START);

    // 3. Atur Giliran Awal
    currentPlayer = 1;
    log("Game Dimulai! Player 1 mulai.");

    // 4. Update UI
    updateUI();

    // 5. Setup Listener
    dom.endTurnBtn.onclick = endTurn;
}


// --- RUN THE GAME ---
initGame();
