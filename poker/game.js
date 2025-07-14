const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.size = 1024; // Optimized for performance
document.getElementById('game-container').appendChild(renderer.domElement);

// Dynamic camera with orbit
camera.position.set(0, 20, 5);
let cameraAngle = 0;
function updateCamera() {
    cameraAngle += 0.002;
    camera.position.x = 10 * Math.sin(cameraAngle);
    camera.position.z = 5 * Math.cos(cameraAngle);
    camera.lookAt(0, 0, 0);
}

// Lighting
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.set(10, 18, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);
const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
scene.add(ambientLight);
const spotLight = new THREE.SpotLight(0xffffff, 0.8);
spotLight.position.set(0, 16, 0);
spotLight.angle = Math.PI / 4;
spotLight.penumbra = 0.5;
spotLight.castShadow = true;
scene.add(spotLight);

// Poker table
const tableGeometry = new THREE.CircleGeometry(8, 64);
const tableMaterial = new THREE.MeshPhongMaterial({
    color: 0x1b5e20, // Deeper WSOP green
    shininess: 80,
    gradientMap: new THREE.DataTexture(new Uint8Array([0, 0.5, 1].map(v => v * 255)), 3, 1) // Gradient for depth
});
const table = new THREE.Mesh(tableGeometry, tableMaterial);
table.rotation.x = -Math.PI / 2;
table.scale.set(1.5, 1, 1);
table.receiveShadow = true;
scene.add(table);

// Gold trim border
const borderGeometry = new THREE.TorusGeometry(8.2, 0.2, 16, 100);
const borderMaterial = new THREE.MeshPhongMaterial({ color: 0xb8860b, shininess: 120 });
const border = new THREE.Mesh(borderGeometry, borderMaterial);
border.rotation.x = -Math.PI / 2;
border.position.y = 0.01;
border.scale.set(1.5, 1, 1);
scene.add(border);

// Leather railing with denser stitching
const railingGeometry = new THREE.TorusGeometry(8.7, 0.5, 16, 100);
const railingMaterial = new THREE.MeshPhongMaterial({ color: 0x1c2526, shininess: 120 });
const railing = new THREE.Mesh(railingGeometry, railingMaterial);
railing.rotation.x = -Math.PI / 2;
railing.position.y = 0.02;
railing.scale.set(1.5, 1, 1);
scene.add(railing);
const stitchGeometry = new THREE.TorusGeometry(8.8, 0.04, 8, 100, Math.PI / 18);
const stitchMaterial = new THREE.MeshBasicMaterial({ color: 0xe0e0e0 });
for (let i = 0; i < 36; i++) {
    const stitch = new THREE.Mesh(stitchGeometry, stitchMaterial);
    stitch.rotation.x = -Math.PI / 2;
    stitch.rotation.z = (i * Math.PI) / 18;
    stitch.position.y = 0.03;
    stitch.scale.set(1.5, 1, 1);
    scene.add(stitch);
}

// Chip visuals
const chipGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 32);
const chipMaterials = [
    new THREE.MeshPhongMaterial({ color: 0xc62828, shininess: 120 }), // Red
    new THREE.MeshPhongMaterial({ color: 0x1565c0, shininess: 120 }), // Blue
    new THREE.MeshPhongMaterial({ color: 0x2e7d32, shininess: 120 }), // Green
    new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 120 }), // White
    new THREE.MeshPhongMaterial({ color: 0x212121, shininess: 120 })  // Black
];
const chipStack = new THREE.Group();
scene.add(chipStack);

// Dealer button with glow
const dealerGeometry = new THREE.CircleGeometry(0.5, 32);
const dealerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, emissive: 0xaaaaaa });
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
    { name: 'Player', chips: 10000, hand: [], active: true, mesh: [], currentBet: 0, position: 'bottom', handsPlayed: 0, handsWon: 0, vpipCount: 0, pfrCount: 0, aggressionCount: 0, history: [] },
    { name: 'AI 1', chips: 10000, hand: [], active: true, mesh: [], currentBet: 0, position: 'top', handsPlayed: 0, handsWon: 0, vpipCount: 0, pfrCount: 0, aggressionCount: 0, history: [] },
    { name: 'AI 2', chips: 10000, hand: [], active: true, mesh: [], currentBet: 0, position: 'left', handsPlayed: 0, handsWon: 0, vpipCount: 0, pfrCount: 0, aggressionCount: 0, history: [] },
    { name: 'AI 3', chips: 10000, hand: [], active: true, mesh: [], currentBet: 0, position: 'right', handsPlayed: 0, handsWon: 0, vpipCount: 0, pfrCount: 0, aggressionCount: 0, history: [] }
];
let pot = 0;
let currentBet = 0;
let gamePhase = 'pre-game';
let dealerIndex = 0;
let smallBlind = 50;
let bigBlind = 100;
let totalHandsPlayed = 0;
const cardMeshes = [];

function createCardMesh(card, x, y, z, isFaceUp = true) {
    const color = card.suit === 'hearts' ? 0xd32f2f : card.suit === 'diamonds' ? 0xf44336 : card.suit === 'clubs' ? 0x1b3c34 : 0x212121;
    const material = new THREE.MeshPhongMaterial({
        color: isFaceUp ? color : 0xfafafa, // White back
        shininess: 120,
        side: THREE.DoubleSide
    });
    const geometry = new THREE.PlaneGeometry(2.2, 3.2); // Larger cards
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 8, 0);
    mesh.rotation.x = -Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { targetX: x, targetY: y, targetZ: z, startX: 0, startY: 8, startZ: 0, progress: 0, hover: false, flipped: !isFaceUp, card: card };
    cardMeshes.push(mesh);
    scene.add(mesh);
    // CSS overlay for card text
    if (isFaceUp) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-text';
        cardDiv.textContent = `${card.value}${card.suit[0].toUpperCase()}`;
        cardDiv.style.position = 'absolute';
        cardDiv.style.color = card.suit === 'hearts' || card.suit === 'diamonds' ? '#fff' : '#000';
        cardDiv.style.fontSize = '40px';
        cardDiv.style.fontFamily = 'Oswald, sans-serif';
        cardDiv.style.pointerEvents = 'none';
        document.getElementById('game-container').appendChild(cardDiv);
        mesh.userData.textDiv = cardDiv;
    }
    return mesh;
}

function updateCardTextPositions() {
    cardMeshes.forEach(mesh => {
        if (mesh.userData.textDiv) {
            const vector = mesh.position.clone().project(camera);
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
            mesh.userData.textDiv.style.left = `${x - 20}px`;
            mesh.userData.textDiv.style.top = `${y - 40}px`;
        }
    });
}

function animateCardDealing() {
    cardMeshes.forEach(mesh => {
        if (mesh.userData.progress < 1) {
            mesh.userData.progress += 0.015; // Smoother animation
            const t = 1 - Math.pow(1 - mesh.userData.progress, 3); // Cubic easing
            mesh.position.x = mesh.userData.startX + (mesh.userData.targetX - mesh.userData.startX) * t;
            mesh.position.y = mesh.userData.startY + (mesh.userData.targetY - mesh.userData.startY) * t;
            mesh.position.z = mesh.userData.startZ + (mesh.userData.targetZ - mesh.userData.startZ) * t;
            if (mesh.userData.flipped) {
                mesh.rotation.y = Math.PI * (1 - t);
            }
        }
        if (mesh.userData.hover && mesh.userData.progress >= 1) {
            mesh.position.y = 0.3 + Math.sin(Date.now() * 0.002) * 0.1;
            mesh.rotation.z = Math.sin(Date.now() * 0.001) * 0.08;
            mesh.rotation.x = -Math.PI / 2 + Math.sin(Date.now() * 0.001) * 0.06;
        } else {
            mesh.position.y = mesh.userData.targetY;
            mesh.rotation.z = 0;
            mesh.rotation.x = -Math.PI / 2;
        }
    });
}

function animateChips() {
    chipStack.children.forEach((chip, i) => {
        if (chip.userData && chip.userData.progress < 1) {
            chip.userData.progress += 0.02;
            const t = 1 - Math.pow(1 - chip.userData.progress, 2);
            const path = chip.userData.path.getPoint(t);
            chip.position.set(path.x, path.y + Math.sin(t * Math.PI) * 0.5, path.z);
            if (chip.userData.progress >= 1) {
                chip.position.y = 0.02 + (i * 0.05);
                chip.rotation.z = Math.random() * 0.1;
            }
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
    cardMeshes.forEach(mesh => {
        if (mesh.userData.textDiv) {
            mesh.userData.textDiv.remove();
        }
        scene.remove(mesh);
    });
    cardMeshes.length = 0;
    players.forEach((player, index) => {
        player.hand = [deck.pop(), deck.pop()];
        player.mesh = [];
        if (index === 0) {
            player.mesh.push(createCardMesh(player.hand[0], -2.8, 0.01, 8.5, true));
            player.mesh.push(createCardMesh(player.hand[1], -0.6, 0.01, 8.5, true));
        } else {
            const angle = (index * Math.PI / 2) + Math.PI / 2;
            const x = 9.5 * Math.cos(angle);
            const z = 6.5 * Math.sin(angle);
            player.mesh.push(createCardMesh(player.hand[0], x - 1.1, 0.01, z, false));
            player.mesh.push(createCardMesh(player.hand[1], x + 1, 0.01, z, false));
        }
    });
}

function dealCommunityCards(phase) {
    const positions = [
        { x: -4.5, y: 0.01, z: 0 }, // Flop 1
        { x: -2.2, y: 0.01, z: 0 }, // Flop 2
        { x: 0, y: 0.01, z: 0 }, // Flop 3
        { x: 2.2, y: 0.01, z: 0 }, // Turn
        { x: 4.5, y: 0.01, z: 0 } // River
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
    const x = 8.5 * Math.cos(angle);
    const z = 6 * Math.sin(angle);
    dealerButton.position.set(x, 0.03, z);
}

function updateChipStack() {
    chipStack.children.forEach(child => chipStack.remove(child));
    const chipCount = Math.min(Math.floor(pot / 100), 40);
    for (let i = 0; i < chipCount; i++) {
        const chip = new THREE.Mesh(chipGeometry, chipMaterials[i % 5]);
        const angle = (i % 5) * Math.PI / 2.5 + Math.random() * 0.3;
        const radius = 0.5 + (Math.floor(i / 5) * 0.25);
        chip.position.set(radius * Math.cos(angle), 0.02 + (i * 0.05), radius * Math.sin(angle));
        chip.rotation.x = -Math.PI / 2;
        chip.rotation.z = Math.random() * 0.1;
        chip.castShadow = true;
        chip.userData = { progress: 0, path: new THREE.CatmullRomCurve3([
            new THREE.Vector3(8, 0.5, 0),
            new THREE.Vector3(4, 1, 0),
            new THREE.Vector3(0, 0.02 + (i * 0.05), 0)
        ]) };
        chipStack.add(chip);
    }
}

function calculateHandStrength(hand, community) {
    const strength = evaluateHand(hand, community).rank;
    return Math.min(100, (strength / 8) * 100);
}

function calculatePotOdds() {
    const bet = currentBet - (players[0].currentBet || 0);
    return bet / (pot + bet + 1) || 0;
}

function calculateOuts(hand, community) {
    const allCards = [...hand, ...community];
    const remainingDeck = deck.filter(card => !allCards.some(c => c.value === card.value && c.suit === card.suit));
    let outs = 0;
    for (let card of remainingDeck) {
        const testHand = evaluateHand(hand, [...community, card]);
        if (testHand.rank > evaluateHand(hand, community).rank) {
            outs++;
        }
    }
    return outs;
}

function calculateOdds(player, community) {
    const allCards = [...player.hand, ...community];
    const remainingDeck = deck.filter(card => !allCards.some(c => c.value === card.value && c.suit === card.suit));
    let wins = 0;
    let total = 0;
    for (let i = 0; i < Math.min(remainingDeck.length, 20); i++) {
        for (let j = i + 1; j < Math.min(remainingDeck.length, 20); j++) {
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
    return total > 0 ? (wins / total) * 100 : 0;
}

function calculateFoldEquity() {
    const activePlayers = players.filter(p => p.active).length;
    const aggression = players[0].aggressionCount / Math.max(1, players[0].handsPlayed);
    return Math.min(50, (1 / activePlayers) * 100 * (1 - aggression * 0.4));
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
    const spr = player.chips / (pot + 1); // Stack-to-pot ratio
    const positionFactor = player.position === 'bottom' ? 0.3 : player.position === 'top' ? 1.8 : 1.0;
    const aggression = (handStrength / 8) * positionFactor * (spr > 10 ? 1.2 : spr > 5 ? 1 : 0.8);
    const playerAggression = playerHistory.slice(-10).reduce((sum, action) => sum + (action === 'raise' ? 1 : action === 'call' ? 0.3 : 0), 0) / Math.max(1, playerHistory.length);
    const bluffChance = gamePhase === 'pre-flop' ? 0.10 : gamePhase === 'flop' ? 0.20 : gamePhase === 'river' ? 0.30 : 0.15;
    const odds = calculateOdds(player, communityCards);

    if (odds > 65 || handStrength >= 5 || (handStrength >= 3 && Math.random() < aggression * (1 - playerAggression * 0.2)) || (potOdds < 0.06 && Math.random() < 0.98) || (Math.random() < bluffChance && player.chips >= bet)) {
        if (Math.random() < aggression * 0.9 && player.chips >= bet + bigBlind * (2 + Math.floor(pot / 1000))) {
            const raise = bet + bigBlind * Math.floor(2 + Math.random() * 6 + pot / 1000);
            player.chips -= raise;
            player.currentBet = currentBet + (raise - bet);
            currentBet = player.currentBet;
            pot += raise;
            player.vpipCount += 1;
            player.pfrCount += 1;
            player.aggressionCount += 1;
            player.history.push('raise');
            return { action: `AI ${player.name} raises to ${currentBet}`, type: 'raise' };
        } else if (player.chips >= bet) {
            player.chips -= bet;
            player.currentBet = currentBet;
            pot += bet;
            player.vpipCount += 1;
            player.history.push('call');
            return { action: `AI ${player.name} calls ${bet || 'check'}`, type: 'call' };
        }
    }
    player.active = false;
    player.history.push('fold');
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

function addToHandHistory(action, type) {
    const historyList = document.getElementById('history-list');
    const li = document.createElement('li');
    li.textContent = action;
    li.className = type;
    historyList.prepend(li);
    if (historyList.children.length > 15) {
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
                        color: player.hand[i].suit === 'hearts' ? 0xd32f2f : player.hand[i].suit === 'diamonds' ? 0xf44336 : player.hand[i].suit === 'clubs' ? 0x1b3c34 : 0x212121,
                        shininess: 120,
                        side: THREE.DoubleSide
                    });
                    mesh.material.needsUpdate = true;
                    const cardDiv = document.createElement('div');
                    cardDiv.className = 'card-text';
                    cardDiv.textContent = `${player.hand[i].value}${player.hand[i].suit[0].toUpperCase()}`;
                    cardDiv.style.position = 'absolute';
                    cardDiv.style.color = player.hand[i].suit === 'hearts' || player.hand[i].suit === 'diamonds' ? '#fff' : '#000';
                    cardDiv.style.fontSize = '40px';
                    cardDiv.style.fontFamily = 'Oswald, sans-serif';
                    cardDiv.style.pointerEvents = 'none';
                    document.getElementById('game-container').appendChild(cardDiv);
                    mesh.userData.textDiv = cardDiv;
                    addToHandHistory(`${player.name} reveals ${player.hand[i].value} of ${player.hand[i].suit}`, 'reveal');
                }
            });
        }
    });
}

function updateOddsAndEquity() {
    const handStrength = calculateHandStrength(players[0].hand, communityCards);
    const potOdds = calculatePotOdds();
    const winOdds = calculateOdds(players[0], communityCards);
    const foldEquity = calculateFoldEquity();
    const outs = calculateOuts(players[0].hand, communityCards);
    document.getElementById('hand-strength').textContent = `${Math.round(handStrength)}%`;
    document.getElementById('pot-odds').textContent = `${(potOdds * 100).toFixed(1)}%`;
    document.getElementById('win-odds').textContent = `${Math.round(winOdds)}%`;
    document.getElementById('fold-equity').textContent = `${Math.round(foldEquity)}%`;
    document.getElementById('outs').textContent = outs;
}

function nextPhase() {
    cameraAngle += Math.PI / 18; // Rotate camera slightly
    if (gamePhase === 'pre-flop') {
        dealCommunityCards('flop');
        gamePhase = 'flop';
        document.getElementById('game-status').textContent = 'Flop';
        addToHandHistory('Flop dealt', 'phase');
    } else if (gamePhase === 'flop') {
        dealCommunityCards('turn');
        gamePhase = 'turn';
        document.getElementById('game-status').textContent = 'Turn';
        addToHandHistory('Turn dealt', 'phase');
    } else if (gamePhase === 'turn') {
        dealCommunityCards('river');
        gamePhase = 'river';
        document.getElementById('game-status').textContent = 'River';
        addToHandHistory('River dealt', 'phase');
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
        document.getElementById('hand-strength').textContent = '0%';
        document.getElementById('pot-odds').textContent = 'N/A';
        document.getElementById('win-odds').textContent = 'N/A';
        document.getElementById('fold-equity').textContent = 'N/A';
        document.getElementById('outs').textContent = 'N/A';
        players.forEach((p, i) => {
            document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips;
            document.getElementById(`player-${i}`).querySelector('.player-action').textContent = '';
        });
        addToHandHistory(`${winner.name} wins pot of ${pot}`, 'win');
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
    const playerHistory = players.flatMap(p => p.history.slice(-10));
    const processNextAI = () => {
        document.getElementById(`player-${index}`).classList.remove('active');
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
                    document.getElementById('hand-strength').textContent = '0%';
                    document.getElementById('pot-odds').textContent = 'N/A';
                    document.getElementById('win-odds').textContent = 'N/A';
                    document.getElementById('fold-equity').textContent = 'N/A';
                    document.getElementById('outs').textContent = 'N/A';
                    players.forEach((p, i) => {
                        document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips;
                        document.getElementById(`player-${i}`).querySelector('.player-action').textContent = '';
                    });
                    addToHandHistory(`${winner.name} wins pot of ${pot}`, 'win');
                    pot = 0;
                    gamePhase = 'pre-game';
                    document.getElementById('actions').style.display = 'none';
                    document.getElementById('game-status').innerHTML = 'Game Over. <button id="start-game">Start New Game</button>';
                    document.getElementById('start-game').addEventListener('click', startGame);
                }
            } else {
                document.getElementById('player-0').classList.add('active');
            }
            return;
        }
        if (players[index].active) {
            document.getElementById(`player-${index}`).classList.add('active');
            const { action, type } = aiDecision(players[index], playerHistory);
            document.getElementById(`player-${index}`).querySelector('.player-action').textContent = type.charAt(0).toUpperCase() + type.slice(1);
            document.getElementById('game-status').textContent = action;
            document.getElementById('pot-amount').textContent = pot;
            players.forEach((p, i) => document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips);
            addToHandHistory(action, type);
        }
        index = (index + 1) % 4;
        if (index !== 0) {
            setTimeout(processNextAI, 1200);
        } else {
            document.getElementById('player-0').classList.add('active');
        }
    };
    processNextAI();
}

function startGame() {
    players.forEach(p => { p.active = true; p.currentBet = 0; p.hand = []; p.mesh = []; p.handsPlayed += 1; });
    communityCards = [];
    cardMeshes.forEach(mesh => {
        if (mesh.userData.textDiv) {
            mesh.userData.textDiv.remove();
        }
        scene.remove(mesh);
    });
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
    document.getElementById('hand-strength').textContent = '0%';
    document.getElementById('pot-odds').textContent = 'N/A';
    document.getElementById('win-odds').textContent = 'N/A';
    document.getElementById('fold-equity').textContent = 'N/A';
    document.getElementById('outs').textContent = 'N/A';
    players.forEach((p, i) => {
        document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips;
        document.getElementById(`player-${i}`).querySelector('.player-action').textContent = '';
    });
    document.getElementById('history-list').innerHTML = '';
    addToHandHistory('New hand started', 'phase');
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
window.addEventListener('mousemove', debounce(onMouseMove, 10));

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
    players[0].history.push('fold');
    document.getElementById('game-status').textContent = 'Player folds';
    document.getElementById('player-0').querySelector('.player-action').textContent = 'Fold';
    document.getElementById('player-0').classList.remove('active');
    addToHandHistory('Player folds', 'fold');
    updateOddsAndEquity();
    nextPhase();
});

document.getElementById('call').addEventListener('click', () => {
    const bet = currentBet - (players[0].currentBet || 0);
    if (players[0].chips >= bet) {
        players[0].chips -= bet;
        players[0].currentBet = currentBet;
        players[0].vpipCount += 1;
        players[0].history.push('call');
        pot += bet;
        document.getElementById('pot-amount').textContent = pot;
        document.getElementById('game-status').textContent = bet > 0 ? 'Player calls' : 'Player checks';
        document.getElementById('player-0').querySelector('.player-action').textContent = bet > 0 ? 'Call' : 'Check';
        document.getElementById('player-0').classList.remove('active');
        players.forEach((p, i) => document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips);
        document.getElementById('vpip').textContent = `${Math.round((players[0].vpipCount / Math.max(1, totalHandsPlayed)) * 100)}%`;
        addToHandHistory(bet > 0 ? `Player calls ${bet}` : 'Player checks', 'call');
        updateOddsAndEquity();
        nextPhase();
    } else {
        document.getElementById('game-status').textContent = 'Not enough chips!';
        addToHandHistory('Player attempted call but lacks chips', 'error');
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
        players[0].history.push('raise');
        pot += bet;
        document.getElementById('pot-amount').textContent = pot;
        document.getElementById('game-status').textContent = `Player raises to ${currentBet}`;
        document.getElementById('player-0').querySelector('.player-action').textContent = `Raise: ${currentBet}`;
        document.getElementById('player-0').classList.remove('active');
        players.forEach((p, i) => document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips);
        document.getElementById('vpip').textContent = `${Math.round((players[0].vpipCount / Math.max(1, totalHandsPlayed)) * 100)}%`;
        document.getElementById('pfr').textContent = `${Math.round((players[0].pfrCount / Math.max(1, totalHandsPlayed)) * 100)}%`;
        document.getElementById('aggression').textContent = players[0].aggressionCount.toFixed(2);
        addToHandHistory(`Player raises to ${currentBet}`, 'raise');
        updateOddsAndEquity();
        runAITurns();
    } else {
        document.getElementById('game-status').textContent = 'Invalid raise amount or not enough chips!';
        addToHandHistory('Player attempted invalid raise', 'error');
    }
});

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    updateCamera();
    animateCardDealing();
    animateChips();
    updateCardTextPositions();
    renderer.render(scene, camera);
}
animate();

// Initialize game
document.getElementById('game-status').innerHTML = '<button id="start-game">Start Game</button>';
document.getElementById('actions').style.display = 'none';
document.getElementById('start-game').addEventListener('click', startGame);