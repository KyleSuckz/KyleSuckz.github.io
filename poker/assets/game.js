const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('game-container').appendChild(renderer.domElement);

// Dynamic camera
camera.position.set(0, 18, 4);
camera.lookAt(0, 0, 0);

// Advanced lighting
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.set(8, 16, 8);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
scene.add(directionalLight);
const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
scene.add(ambientLight);
const spotLight = new THREE.SpotLight(0xffffff, 0.8);
spotLight.position.set(0, 14, 0);
spotLight.angle = Math.PI / 4;
spotLight.penumbra = 0.4;
spotLight.castShadow = true;
scene.add(spotLight);

// Poker table (oval shape)
const textureLoader = new THREE.TextureLoader();
const tableTexture = textureLoader.load('assets/table_felt.jpg', undefined, undefined, (err) => {
    console.error('Error loading table texture:', err);
});
tableTexture.minFilter = THREE.LinearFilter;
tableTexture.magFilter = THREE.LinearFilter;
const tableGeometry = new THREE.CircleGeometry(8, 64); // Oval table
const tableMaterial = new THREE.MeshPhongMaterial({ map: tableTexture, shininess: 60 });
const table = new THREE.Mesh(tableGeometry, tableMaterial);
table.rotation.x = -Math.PI / 2;
table.scale.set(1.5, 1, 1); // Stretch to oval
table.receiveShadow = true;
scene.add(table);

// Padded leather railing
const railingTexture = textureLoader.load('assets/railing.jpg', undefined, undefined, (err) => {
    console.error('Error loading railing texture:', err);
});
railingTexture.minFilter = THREE.LinearFilter;
const railingGeometry = new THREE.TorusGeometry(8.5, 0.6, 16, 100);
const railingMaterial = new THREE.MeshPhongMaterial({ map: railingTexture, shininess: 100 });
const railing = new THREE.Mesh(railingGeometry, railingMaterial);
railing.rotation.x = -Math.PI / 2;
railing.position.y = 0.01;
railing.scale.set(1.5, 1, 1);
scene.add(railing);

// Chip visuals
const chipGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.06, 32);
const chipMaterials = [
    new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 100 }), // Red
    new THREE.MeshPhongMaterial({ color: 0x0000ff, shininess: 100 }), // Blue
    new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 100 }), // Green
    new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 100 }), // White
    new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100 })  // Black
];
const chipStack = new THREE.Group();
scene.add(chipStack);

// Dealer button
const dealerGeometry = new THREE.CircleGeometry(0.4, 32);
const dealerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const dealerButton = new THREE.Mesh(dealerGeometry, dealerMaterial);
dealerButton.rotation.x = -Math.PI / 2;
scene.add(dealerButton);

// Card data
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const deck = [];
suits.forEach(suit => values.forEach(value => deck.push({ suit, value })));
let communityCards = [];
let players = [
    { name: 'Player', chips: 10000, hand: [], active: true, mesh: [], currentBet: 0, position: 'bottom', handsPlayed: 0, handsWon: 0, vpipCount: 0, pfrCount: 0, aggressionCount: 0 },
    { name: 'AI 1', chips: 10000, hand: [], active: true, mesh: [], currentBet: 0, position: 'top', handsPlayed: 0, handsWon: 0, vpipCount: 0, pfrCount: 0, aggressionCount: 0 },
    { name: 'AI 2', chips: 10000, hand: [], active: true, mesh: [], currentBet: 0, position: 'left', handsPlayed: 0, handsWon: 0, vpipCount: 0, pfrCount: 0, aggressionCount: 0 },
    { name: 'AI 3', chips: 10000, hand: [], active: true, mesh: [], currentBet: 0, position: 'right', handsPlayed: 0, handsWon: 0, vpipCount: 0, pfrCount: 0, aggressionCount: 0 }
];
let pot = 0;
let currentBet = 0;
let gamePhase = 'pre-game';
let dealerIndex = 0;
let smallBlind = 50;
let bigBlind = 100;
let totalHandsPlayed = 0;
const cardMeshes = [];
const cardBackTexture = textureLoader.load('assets/card_back.png', undefined, undefined, (err) => {
    console.error('Error loading card back texture:', err);
});
cardBackTexture.minFilter = THREE.LinearFilter;

function createCardMesh(card, x, y, z, isFaceUp = true) {
    const texture = isFaceUp ? textureLoader.load(`assets/cards/${formatCardValue(card.value)}_of_${card.suit}.png`, undefined, undefined, (err) => {
        console.error(`Error loading card texture ${card.value}_of_${card.suit}:`, err);
    }) : cardBackTexture;
    texture.minFilter = THREE.LinearFilter;
    const geometry = new THREE.PlaneGeometry(2, 2.8); // Large, realistic cards
    const material = new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide, shininess: 100 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 8, 0);
    mesh.rotation.x = -Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { targetX: x, targetY: y, targetZ: z, startX: 0, startY: 8, startZ: 0, progress: 0, hover: false, flipped: !isFaceUp };
    cardMeshes.push(mesh);
    scene.add(mesh);
    return mesh;
}

function formatCardValue(value) {
    return value === 'A' ? 'ace' :
           value === 'K' ? 'king' :
           value === 'Q' ? 'queen' :
           value === 'J' ? 'jack' :
           value.toLowerCase();
}

function animateCardDealing() {
    cardMeshes.forEach(mesh => {
        if (mesh.userData.progress < 1) {
            mesh.userData.progress += 0.01;
            const t = Math.sin(mesh.userData.progress * Math.PI / 2);
            mesh.position.x = mesh.userData.startX + (mesh.userData.targetX - mesh.userData.startX) * t;
            mesh.position.y = mesh.userData.startY + (mesh.userData.targetY - mesh.userData.startY) * t;
            mesh.position.z = mesh.userData.startZ + (mesh.userData.targetZ - mesh.userData.startZ) * t;
            if (mesh.userData.flipped) {
                mesh.rotation.y = Math.PI * (1 - t);
            }
        }
        if (mesh.userData.hover && mesh.userData.progress >= 1) {
            mesh.position.y = 0.2 + Math.sin(Date.now() * 0.002) * 0.08;
            mesh.rotation.z = Math.sin(Date.now() * 0.001) * 0.06;
            mesh.rotation.x = -Math.PI / 2 + Math.sin(Date.now() * 0.001) * 0.04;
        } else {
            mesh.position.y = mesh.userData.targetY;
            mesh.rotation.z = 0;
            mesh.rotation.x = -Math.PI / 2;
        }
    });
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function dealCards() {
    shuffleDeck();
    communityCards = [];
    cardMeshes.forEach(mesh => scene.remove(mesh));
    cardMeshes.length = 0;
    players.forEach((player, index) => {
        player.hand = [deck.pop(), deck.pop()];
        player.mesh = [];
        if (index === 0) {
            player.mesh.push(createCardMesh(player.hand[0], -2.5, 0.01, 8, true));
            player.mesh.push(createCardMesh(player.hand[1], -0.5, 0.01, 8, true));
        } else {
            const angle = (index * Math.PI / 2) + Math.PI / 2;
            const x = 9 * Math.cos(angle);
            const z = 6 * Math.sin(angle);
            player.mesh.push(createCardMesh(player.hand[0], x - 1, 0.01, z, false));
            player.mesh.push(createCardMesh(player.hand[1], x + 0.9, 0.01, z, false));
        }
    });
}

function dealCommunityCards(phase) {
    const positions = [
        { x: -4, y: 0.01, z: 0 }, // Flop 1
        { x: -2, y: 0.01, z: 0 }, // Flop 2
        { x: 0, y: 0.01, z: 0 }, // Flop 3
        { x: 2, y: 0.01, z: 0 }, // Turn
        { x: 4, y: 0.01, z: 0 } // River
    ];
    if (phase === 'flop') {
        for (let i = 0; i < 3; i++) {
            const card = deck.pop();
            communityCards.push(card);
            createCardMesh(card, positions[i].x, positions[i].y, positions[i].z, true);
        }
    } else if (phase === 'turn' || phase === 'river') {
        const card = deck.pop();
        communityCards.push(card);
        createCardMesh(card, positions[communityCards.length - 1].x, positions[communityCards.length - 1].y, positions[communityCards.length - 1].z, true);
    }
}

function updateDealerButton() {
    const angle = (dealerIndex * Math.PI / 2) + Math.PI / 2;
    const x = 8 * Math.cos(angle);
    const z = 5.5 * Math.sin(angle);
    dealerButton.position.set(x, 0.02, z);
}

function updateChipStack() {
    chipStack.children.forEach(child => chipStack.remove(child));
    const chipCount = Math.min(Math.floor(pot / 100), 60);
    for (let i = 0; i < chipCount; i++) {
        const chip = new THREE.Mesh(chipGeometry, chipMaterials[i % 5]);
        const angle = (i % 5) * Math.PI / 2.5 + Math.random() * 0.4;
        const radius = 0.6 + (Math.floor(i / 5) * 0.3);
        chip.position.set(radius * Math.cos(angle), 0.02 + (i * 0.06), radius * Math.sin(angle));
        chip.rotation.x = -Math.PI / 2;
        chip.rotation.z = Math.random() * 0.2;
        chip.castShadow = true;
        chipStack.add(chip);
    }
}

function calculateOdds(player, community) {
    const allCards = [...player.hand, ...community];
    const remainingDeck = deck.filter(card => !allCards.some(c => c.value === card.value && c.suit === card.suit));
    let wins = 0;
    let total = 0;
    if (community.length < 5) {
        for (let i = 0; i < remainingDeck.length; i++) {
            for (let j = i + 1; j < remainingDeck.length; j++) {
                const testCommunity = [...community, remainingDeck[i], remainingDeck[j]].slice(0, 5);
                const playerStrength = evaluateHand(player.hand, testCommunity);
                let isWin = true;
                for (let k = 1; k < players.length; k++) {
                    if (players[k].active) {
                        const aiStrength = evaluateHand(players[k].hand, testCommunity);
                        if (aiStrength.rank > playerStrength.rank || (aiStrength.rank === playerStrength.rank && values.indexOf(aiStrength.value) > values.indexOf(playerStrength.value))) {
                            isWin = false;
                            break;
                        }
                    }
                }
                if (isWin) wins++;
                total++;
            }
        }
    } else {
        const playerStrength = evaluateHand(player.hand, community);
        let isWin = true;
        for (let k = 1; k < players.length; k++) {
            if (players[k].active) {
                const aiStrength = evaluateHand(players[k].hand, community);
                if (aiStrength.rank > playerStrength.rank || (aiStrength.rank === playerStrength.rank && values.indexOf(aiStrength.value) > values.indexOf(playerStrength.value))) {
                    isWin = false;
                    break;
                }
            }
        }
        wins = isWin ? 1 : 0;
        total = 1;
    }
    return total > 0 ? (wins / total) * 100 : 0;
}

function calculateFoldEquity() {
    const activePlayers = players.filter(p => p.active).length;
    const aggression = players[0].aggressionCount / Math.max(1, players[0].handsPlayed);
    return Math.min(50, (1 / activePlayers) * 100 * (1 - aggression * 0.5));
}

function evaluateHand(hand, community) {
    const allCards = [...hand, ...community];
    const cardValues = allCards.map(card => card.value);
    const suits = allCards.map(card => card.suit);
    const valueIndices = cardValues.map(v => values.indexOf(v)).sort((a, b) => a - b);
    const suitCounts = {};
    suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
    const valueCounts = {};
    cardValues.forEach(v => valueCounts[v] = (valueCounts[v] || 0) + 1);

    const flushSuit = Object.keys(suitCounts).find(s => suitCounts[s] >= 5);
    const flush = flushSuit ? allCards.filter(c => c.suit === flushSuit) : null;

    let straightHigh = null;
    const uniqueIndices = [...new Set(valueIndices)];
    for (let i = 0; i <= uniqueIndices.length - 5; i++) {
        if (uniqueIndices[i + 4] - uniqueIndices[i] === 4) {
            straightHigh = values[uniqueIndices[i + 4]];
            break;
        }
    }
    if (uniqueIndices.includes(12) && uniqueIndices.includes(0) && uniqueIndices.includes(1) && uniqueIndices.includes(2) && uniqueIndices.includes(3)) {
        straightHigh = '5';
    }

    if (flush && straightHigh) {
        const flushValues = flush.map(c => values.indexOf(c.value)).sort((a, b) => a - b);
        if (flushValues[4] - flushValues[0] === 4 || (flushValues.includes(12) && flushValues.includes(0))) {
            return { rank: 8, value: straightHigh };
        }
    }
    if (Object.values(valueCounts).some(c => c === 4)) {
        return { rank: 7, value: Object.keys(valueCounts).find(k => valueCounts[k] === 4) };
    }
    if (Object.values(valueCounts).some(c => c === 3) && Object.values(valueCounts).some(c => c === 2)) {
        return { rank: 6, value: Object.keys(valueCounts).find(k => valueCounts[k] === 3) };
    }
    if (flush) return { rank: 5, value: flush[0].value };
    if (straightHigh) return { rank: 4, value: straightHigh };
    if (Object.values(valueCounts).some(c => c === 3)) {
        return { rank: 3, value: Object.keys(valueCounts).find(k => valueCounts[k] === 3) };
    }
    if (Object.values(valueCounts).filter(c => c === 2).length === 2) {
        const pairs = Object.keys(valueCounts).filter(k => valueCounts[k] === 2).sort((a, b) => values.indexOf(b) - values.indexOf(a));
        return { rank: 2, value: pairs[0] };
    }
    if (Object.values(valueCounts).some(c => c === 2)) {
        return { rank: 1, value: Object.keys(valueCounts).find(k => valueCounts[k] === 2) };
    }
    return { rank: 0, value: cardValues.sort((a, b) => values.indexOf(b) - values.indexOf(a))[0] };
}

function aiDecision(player, playerHistory) {
    const handStrength = evaluateHand(player.hand, communityCards).rank;
    const bet = currentBet - (player.currentBet || 0);
    const potOdds = bet / (pot + bet + 1);
    const positionFactor = player.position === 'bottom' ? 0.4 : player.position === 'top' ? 1.6 : 1.0;
    const aggression = (handStrength / 8) * positionFactor;
    const playerAggression = playerHistory.reduce((sum, action) => sum + (action === 'raise' ? 1 : action === 'call' ? 0.4 : 0), 0) / Math.max(1, playerHistory.length);
    const bluffChance = gamePhase === 'pre-flop' ? 0.12 : gamePhase === 'river' ? 0.25 : 0.18;
    const odds = calculateOdds(player, communityCards);

    if (odds > 60 || handStrength >= 5 || (handStrength >= 3 && Math.random() < aggression * (1 - playerAggression * 0.25)) || (potOdds < 0.07 && Math.random() < 0.97) || (Math.random() < bluffChance && player.chips >= bet)) {
        if (Math.random() < aggression * 0.85 && player.chips >= bet + bigBlind * 4) {
            const raise = bet + bigBlind * Math.floor(4 + Math.random() * 8);
            player.chips -= raise;
            player.currentBet = currentBet + (raise - bet);
            currentBet = player.currentBet;
            pot += raise;
            player.vpipCount += 1;
            player.pfrCount += 1;
            player.aggressionCount += 1;
            return { action: `AI ${player.name} raises to ${currentBet}`, type: 'raise' };
        } else if (player.chips >= bet) {
            player.chips -= bet;
            player.currentBet = currentBet;
            pot += bet;
            player.vpipCount += 1;
            return { action: `AI ${player.name} calls ${bet || 'check'}`, type: 'call' };
        }
    }
    player.active = false;
    return { action: `AI ${player.name} folds`, type: 'fold' };
}

function postBlinds() {
    const smallBlindPlayer = players[(dealerIndex + 1) % 4];
    const bigBlindPlayer = players[(dealerIndex + 2) % 4];
    if (smallBlindPlayer.chips >= smallBlind) {
        smallBlindPlayer.chips -= smallBlind;
        smallBlindPlayer.currentBet = smallBlind;
        smallBlindPlayer.vpipCount += 1;
        pot += smallBlind;
        document.getElementById(`player-${(dealerIndex + 1) % 4}`).querySelector('.player-action').textContent = `Small Blind: ${smallBlind}`;
    } else {
        smallBlindPlayer.active = false;
    }
    if (bigBlindPlayer.chips >= bigBlind) {
        bigBlindPlayer.chips -= bigBlind;
        bigBlindPlayer.currentBet = bigBlind;
        bigBlindPlayer.vpipCount += 1;
        pot += bigBlind;
        currentBet = bigBlind;
        document.getElementById(`player-${(dealerIndex + 2) % 4}`).querySelector('.player-action').textContent = `Big Blind: ${bigBlind}`;
    } else {
        bigBlindPlayer.active = false;
    }
    updateChipStack();
    document.getElementById('pot-amount').textContent = pot;
    players.forEach((p, i) => document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips);
}

function addToHandHistory(action) {
    const historyList = document.getElementById('history-list');
    const li = document.createElement('li');
    li.textContent = action;
    historyList.prepend(li);
    if (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
}

function revealAIHands() {
    players.forEach((player, index) => {
        if (index !== 0 && player.active) {
            player.mesh.forEach((mesh, i) => {
                if (mesh.userData.flipped) {
                    mesh.userData.flipped = false;
                    mesh.material = new THREE.MeshPhongMaterial({
                        map: textureLoader.load(`assets/cards/${formatCardValue(player.hand[i].value)}_of_${player.hand[i].suit}.png`),
                        side: THREE.DoubleSide,
                        shininess: 100
                    });
                    mesh.material.needsUpdate = true;
                    addToHandHistory(`${player.name} reveals ${player.hand[0].value} of ${player.hand[0].suit}, ${player.hand[1].value} of ${player.hand[1].suit}`);
                }
            });
        }
    });
}

function updateOddsAndEquity() {
    const winOdds = calculateOdds(players[0], communityCards);
    const foldEquity = calculateFoldEquity();
    document.getElementById('win-odds').textContent = `${Math.round(winOdds)}%`;
    document.getElementById('fold-equity').textContent = `${Math.round(foldEquity)}%`;
}

function nextPhase() {
    if (gamePhase === 'pre-flop') {
        dealCommunityCards('flop');
        gamePhase = 'flop';
        document.getElementById('game-status').textContent = 'Flop';
        addToHandHistory('Flop dealt');
    } else if (gamePhase === 'flop') {
        dealCommunityCards('turn');
        gamePhase = 'turn';
        document.getElementById('game-status').textContent = 'Turn';
        addToHandHistory('Turn dealt');
    } else if (gamePhase === 'turn') {
        dealCommunityCards('river');
        gamePhase = 'river';
        document.getElementById('game-status').textContent = 'River';
        addToHandHistory('River dealt');
    } else if (gamePhase === 'river') {
        revealAIHands();
        const activePlayers = players.filter(p => p.active);
        const hands = activePlayers.map(p => ({ player: p, strength: evaluateHand(p.hand, communityCards) }));
        hands.sort((a, b) => b.strength.rank - a.strength.rank || values.indexOf(b.strength.value) - values.indexOf(a.strength.value));
        const winner = hands[0].player;
        winner.chips += pot;
        winner.handsWon += 1;
        totalHandsPlayed += 1;
        document.getElementById('game-status').textContent = `${winner.name} wins ${pot} chips!`;
        document.getElementById('pot-amount').textContent = 0;
        document.getElementById('hands-played').textContent = totalHandsPlayed;
        document.getElementById('win-rate').textContent = `${Math.round((players[0].handsWon / Math.max(1, totalHandsPlayed)) * 100)}%`;
        document.getElementById('vpip').textContent = `${Math.round((players[0].vpipCount / Math.max(1, totalHandsPlayed)) * 100)}%`;
        document.getElementById('pfr').textContent = `${Math.round((players[0].pfrCount / Math.max(1, totalHandsPlayed)) * 100)}%`;
        document.getElementById('aggression').textContent = players[0].aggressionCount.toFixed(2);
        document.getElementById('win-odds').textContent = 'N/A';
        document.getElementById('fold-equity').textContent = 'N/A';
        players.forEach((p, i) => {
            document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips;
            document.getElementById(`player-${i}`).querySelector('.player-action').textContent = '';
        });
        addToHandHistory(`${winner.name} wins pot of ${pot}`);
        pot = 0;
        gamePhase = 'pre-game';
        document.getElementById('actions').style.display = 'none';
        document.getElementById('game-status').innerHTML = 'Game Over. <button id="start-game">Start New Game</button>';
        document.getElementById('start-game').addEventListener('click', startGame);
    }
    currentBet = 0;
    players.forEach(p => p.currentBet = 0);
    updateOddsAndEquity();
    runAITurns();
}

function runAITurns() {
    let index = (dealerIndex + 3) % 4;
    const playerHistory = [];
    const processNextAI = () => {
        if (index === 0 || gamePhase === 'pre-game') {
            if (players.filter(p => p.active).length <= 1 && gamePhase !== 'pre-game') {
                const winner = players.find(p => p.active);
                if (winner) {
                    winner.chips += pot;
                    winner.handsWon += 1;
                    totalHandsPlayed += 1;
                    document.getElementById('game-status').textContent = `${winner.name} wins ${pot} chips!`;
                    document.getElementById('pot-amount').textContent = 0;
                    document.getElementById('hands-played').textContent = totalHandsPlayed;
                    document.getElementById('win-rate').textContent = `${Math.round((players[0].handsWon / Math.max(1, totalHandsPlayed)) * 100)}%`;
                    document.getElementById('vpip').textContent = `${Math.round((players[0].vpipCount / Math.max(1, totalHandsPlayed)) * 100)}%`;
                    document.getElementById('pfr').textContent = `${Math.round((players[0].pfrCount / Math.max(1, totalHandsPlayed)) * 100)}%`;
                    document.getElementById('aggression').textContent = players[0].aggressionCount.toFixed(2);
                    document.getElementById('win-odds').textContent = 'N/A';
                    document.getElementById('fold-equity').textContent = 'N/A';
                    players.forEach((p, i) => {
                        document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips;
                        document.getElementById(`player-${i}`).querySelector('.player-action').textContent = '';
                    });
                    addToHandHistory(`${winner.name} wins pot of ${pot}`);
                    pot = 0;
                    gamePhase = 'pre-game';
                    document.getElementById('actions').style.display = 'none';
                    document.getElementById('game-status').innerHTML = 'Game Over. <button id="start-game">Start New Game</button>';
                    document.getElementById('start-game').addEventListener('click', startGame);
                }
            }
            return;
        }
        if (players[index].active) {
            const { action, type } = aiDecision(players[index], playerHistory);
            playerHistory.push(type);
            document.getElementById(`player-${index}`).querySelector('.player-action').textContent = type.charAt(0).toUpperCase() + type.slice(1);
            document.getElementById('game-status').textContent = action;
            document.getElementById('pot-amount').textContent = pot;
            players.forEach((p, i) => document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips);
            addToHandHistory(action);
        }
        index = (index + 1) % 4;
        if (index !== 0) {
            setTimeout(processNextAI, 2000);
        }
    };
    processNextAI();
}

function startGame() {
    players.forEach(p => { p.active = true; p.currentBet = 0; p.hand = []; p.mesh = []; p.handsPlayed += 1; });
    communityCards = [];
    cardMeshes.forEach(mesh => scene.remove(mesh));
    cardMeshes.length = 0;
    pot = 0;
    currentBet = 0;
    gamePhase = 'pre-flop';
    dealerIndex = (dealerIndex + 1) % 4;
    postBlinds();
    dealCards();
    updateDealerButton();
    updateChipStack();
    document.getElementById('game-status').textContent = 'New Round: Pre-flop';
    document.getElementById('pot-amount').textContent = pot;
    document.getElementById('hands-played').textContent = totalHandsPlayed;
    document.getElementById('win-rate').textContent = `${Math.round((players[0].handsWon / Math.max(1, totalHandsPlayed)) * 100)}%`;
    document.getElementById('vpip').textContent = `${Math.round((players[0].vpipCount / Math.max(1, totalHandsPlayed)) * 100)}%`;
    document.getElementById('pfr').textContent = `${Math.round((players[0].pfrCount / Math.max(1, totalHandsPlayed)) * 100)}%`;
    document.getElementById('aggression').textContent = players[0].aggressionCount.toFixed(2);
    document.getElementById('win-odds').textContent = 'N/A';
    document.getElementById('fold-equity').textContent = 'N/A';
    players.forEach((p, i) => {
        document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips;
        document.getElementById(`player-${i}`).querySelector('.player-action').textContent = '';
    });
    document.getElementById('history-list').innerHTML = '';
    addToHandHistory('New hand started');
    document.getElementById('actions').style.display = 'block';
    runAITurns();
}

// Card interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cardMeshes);
    cardMeshes.forEach(mesh => mesh.userData.hover = false);
    if (intersects.length > 0) {
        const mesh = intersects[0].object;
        if (mesh.userData.progress >= 1) {
            mesh.userData.hover = true;
        }
    }
}
window.addEventListener('mousemove', onMouseMove);

// Theme switching
document.getElementById('theme-dark').addEventListener('click', () => {
    document.body.classList.remove('light-theme', 'vegas-theme');
});
document.getElementById('theme-light').addEventListener('click', () => {
    document.body.classList.remove('vegas-theme');
    document.body.classList.add('light-theme');
});
document.getElementById('theme-vegas').addEventListener('click', () => {
    document.body.classList.remove('light-theme');
    document.body.classList.add('vegas-theme');
});

// UI event listeners
document.getElementById('fold').addEventListener('click', () => {
    players[0].active = false;
    document.getElementById('game-status').textContent = 'Player folds';
    document.getElementById('player-0').querySelector('.player-action').textContent = 'Fold';
    addToHandHistory('Player folds');
    updateOddsAndEquity();
    nextPhase();
});

document.getElementById('call').addEventListener('click', () => {
    const bet = currentBet - (players[0].currentBet || 0);
    if (players[0].chips >= bet) {
        players[0].chips -= bet;
        players[0].currentBet = currentBet;
        players[0].vpipCount += 1;
        pot += bet;
        document.getElementById('pot-amount').textContent = pot;
        document.getElementById('game-status').textContent = bet > 0 ? 'Player calls' : 'Player checks';
        document.getElementById('player-0').querySelector('.player-action').textContent = bet > 0 ? 'Call' : 'Check';
        players.forEach((p, i) => document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips);
        document.getElementById('vpip').textContent = `${Math.round((players[0].vpipCount / Math.max(1, totalHandsPlayed)) * 100)}%`;
        addToHandHistory(bet > 0 ? `Player calls ${bet}` : 'Player checks');
        updateOddsAndEquity();
        nextPhase();
    } else {
        document.getElementById('game-status').textContent = 'Not enough chips!';
        addToHandHistory('Player attempted call but lacks chips');
    }
});

document.getElementById('raise').addEventListener('click', () => {
    const raiseAmount = parseInt(document.getElementById('raise-amount').value);
    const bet = currentBet - (players[0].currentBet || 0) + raiseAmount;
    if (players[0].chips >= bet && raiseAmount >= bigBlind) {
        players[0].chips -= bet;
        players[0].currentBet = currentBet + raiseAmount;
        currentBet = players[0].currentBet;
        players[0].vpipCount += 1;
        players[0].pfrCount += 1;
        players[0].aggressionCount += 1;
        pot += bet;
        document.getElementById('pot-amount').textContent = pot;
        document.getElementById('game-status').textContent = `Player raises to ${currentBet}`;
        document.getElementById('player-0').querySelector('.player-action').textContent = `Raise: ${currentBet}`;
        players.forEach((p, i) => document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips);
        document.getElementById('vpip').textContent = `${Math.round((players[0].vpipCount / Math.max(1, totalHandsPlayed)) * 100)}%`;
        document.getElementById('pfr').textContent = `${Math.round((players[0].pfrCount / Math.max(1, totalHandsPlayed)) * 100)}%`;
        document.getElementById('aggression').textContent = players[0].aggressionCount.toFixed(2);
        addToHandHistory(`Player raises to ${currentBet}`);
        updateOddsAndEquity();
        runAITurns();
    } else {
        document.getElementById('game-status').textContent = 'Invalid raise amount or not enough chips!';
        addToHandHistory('Player attempted invalid raise');
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    animateCardDealing();
    updateChipStack();
    renderer.render(scene, camera);
}
animate();

// Initialize game
document.getElementById('game-status').innerHTML = '<button id="start-game">Start Game</button>';
document.getElementById('actions').style.display = 'none';
document.getElementById('start-game').addEventListener('click', startGame);