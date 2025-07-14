const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

// Static top-down camera
camera.position.set(0, 12, 0); // Higher for full table view
camera.lookAt(0, 0, 0);

// Enhanced lighting
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);
const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
scene.add(ambientLight);

// Table setup
const textureLoader = new THREE.TextureLoader();
const tableTexture = textureLoader.load('table_texture.jpg', undefined, undefined, (err) => {
    console.error('Error loading table texture:', err);
});
tableTexture.minFilter = THREE.LinearFilter;
tableTexture.magFilter = THREE.LinearFilter;
const tableGeometry = new THREE.PlaneGeometry(12, 6); // Large casino table
const tableMaterial = new THREE.MeshPhongMaterial({ map: tableTexture });
const table = new THREE.Mesh(tableGeometry, tableMaterial);
table.rotation.x = -Math.PI / 2;
scene.add(table);

// Chip visuals
const chipGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.02, 32);
const chipMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const chipStack = new THREE.Group();
scene.add(chipStack);

// Dealer button
const dealerGeometry = new THREE.CircleGeometry(0.2, 32);
const dealerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const dealerButton = new THREE.Mesh(dealerGeometry, dealerMaterial);
scene.add(dealerButton);

// Card data
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const deck = [];
suits.forEach(suit => values.forEach(value => deck.push({ suit, value })));
let communityCards = [];
let players = [
    { name: 'Player', chips: 1000, hand: [], active: true, mesh: [], currentBet: 0, position: 'bottom' },
    { name: 'AI 1', chips: 1000, hand: [], active: true, mesh: [], currentBet: 0, position: 'top' },
    { name: 'AI 2', chips: 1000, hand: [], active: true, mesh: [], currentBet: 0, position: 'left' },
    { name: 'AI 3', chips: 1000, hand: [], active: true, mesh: [], currentBet: 0, position: 'right' }
];
let pot = 0;
let currentBet = 0;
let gamePhase = 'pre-game';
let dealerIndex = 0;
let smallBlind = 5;
let bigBlind = 10;
const cardMeshes = [];
const cardBackTexture = textureLoader.load('cards/card_back.png', undefined, undefined, (err) => {
    console.error('Error loading card back texture:', err);
});
cardBackTexture.minFilter = THREE.LinearFilter;

function createCardMesh(card, x, y, z, isFaceUp = true) {
    const texture = isFaceUp ? textureLoader.load(`cards/${formatCardValue(card.value)}_of_${card.suit}.png`, undefined, undefined, (err) => {
        console.error(`Error loading card texture ${card.value}_of_${card.suit}:`, err);
    }) : cardBackTexture;
    texture.minFilter = THREE.LinearFilter;
    const geometry = new THREE.PlaneGeometry(1, 1.4); // Larger cards
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.x = -Math.PI / 2;
    mesh.userData = { targetX: x, targetY: y, targetZ: z, startX: 0, startY: 5, startZ: 0, progress: 0 };
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
            mesh.userData.progress += 0.05;
            const t = mesh.userData.progress;
            mesh.position.x = mesh.userData.startX + (mesh.userData.targetX - mesh.userData.startX) * t;
            mesh.position.y = mesh.userData.startY + (mesh.userData.targetY - mesh.userData.startY) * t;
            mesh.position.z = mesh.userData.startZ + (mesh.userData.targetZ - mesh.userData.startZ) * t;
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
        if (index === 0) { // Player at bottom
            player.mesh.push(createCardMesh(player.hand[0], -1.2, 0.01, 4, true));
            player.mesh.push(createCardMesh(player.hand[1], -0.2, 0.01, 4, true));
        } else { // AI players
            const angle = (index * Math.PI / 2) + Math.PI / 2;
            const x = 5 * Math.cos(angle);
            const z = 5 * Math.sin(angle);
            player.mesh.push(createCardMesh(player.hand[0], x - 0.6, 0.01, z, false));
            player.mesh.push(createCardMesh(player.hand[1], x + 0.4, 0.01, z, false));
        }
    });
}

function dealCommunityCards(phase) {
    const positions = [
        { x: -2, y: 0.01, z: 0 }, // Flop 1
        { x: -1, y: 0.01, z: 0 }, // Flop 2
        { x: 0, y: 0.01, z: 0 }, // Flop 3
        { x: 1, y: 0.01, z: 0 }, // Turn
        { x: 2, y: 0.01, z: 0 } // River
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
    const x = 4.5 * Math.cos(angle);
    const z = 4.5 * Math.sin(angle);
    dealerButton.position.set(x, 0.02, z);
    dealerButton.rotation.x = -Math.PI / 2;
}

function updateChipStack() {
    chipStack.children.forEach(child => chipStack.remove(child));
    const chipCount = Math.min(Math.floor(pot / 10), 20); // Limit to 20 chips
    for (let i = 0; i < chipCount; i++) {
        const chip = new THREE.Mesh(chipGeometry, chipMaterial);
        chip.position.set(0, 0.02 + i * 0.02, 0);
        chip.rotation.x = -Math.PI / 2;
        chipStack.add(chip);
    }
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

    // Flush
    const flushSuit = Object.keys(suitCounts).find(s => suitCounts[s] >= 5);
    const flush = flushSuit ? allCards.filter(c => c.suit === flushSuit) : null;

    // Straight
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

    // Hand rankings
    if (flush && straightHigh) {
        const flushValues = flush.map(c => values.indexOf(c.value)).sort((a, b) => a - b);
        if (flushValues[4] - flushValues[0] === 4 || (flushValues.includes(12) && flushValues.includes(0))) {
            return { rank: 8, value: straightHigh }; // Straight flush
        }
    }
    if (Object.values(valueCounts).some(c => c === 4)) {
        return { rank: 7, value: Object.keys(valueCounts).find(k => valueCounts[k] === 4) }; // Four of a kind
    }
    if (Object.values(valueCounts).some(c => c === 3) && Object.values(valueCounts).some(c => c === 2)) {
        return { rank: 6, value: Object.keys(valueCounts).find(k => valueCounts[k] === 3) }; // Full house
    }
    if (flush) return { rank: 5, value: flush[0].value }; // Flush
    if (straightHigh) return { rank: 4, value: straightHigh }; // Straight
    if (Object.values(valueCounts).some(c => c === 3)) {
        return { rank: 3, value: Object.keys(valueCounts).find(k => valueCounts[k] === 3) }; // Three of a kind
    }
    if (Object.values(valueCounts).filter(c => c === 2).length === 2) {
        const pairs = Object.keys(valueCounts).filter(k => valueCounts[k] === 2).sort((a, b) => values.indexOf(b) - values.indexOf(a));
        return { rank: 2, value: pairs[0] }; // Two pair
    }
    if (Object.values(valueCounts).some(c => c === 2)) {
        return { rank: 1, value: Object.keys(valueCounts).find(k => valueCounts[k] === 2) }; // Pair
    }
    return { rank: 0, value: cardValues.sort((a, b) => values.indexOf(b) - values.indexOf(a))[0] }; // High card
}

function aiDecision(player) {
    const handStrength = evaluateHand(player.hand, communityCards).rank;
    const bet = currentBet - (player.currentBet || 0);
    const potOdds = bet / (pot + bet + 1);
    const positionFactor = player.position === 'bottom' ? 0.8 : player.position === 'top' ? 1.2 : 1.0;
    const aggression = (handStrength / 8) * positionFactor;

    if (handStrength >= 4 || (handStrength >= 2 && Math.random() < aggression) || (potOdds < 0.15 && Math.random() < 0.8)) {
        if (Math.random() < aggression * 0.5 && player.chips >= bet + bigBlind * 2) {
            const raise = bet + bigBlind * Math.floor(2 + Math.random() * 3);
            player.chips -= raise;
            player.currentBet = currentBet + (raise - bet);
            currentBet = player.currentBet;
            pot += raise;
            return `AI ${player.name} raises to ${currentBet}`;
        } else if (player.chips >= bet) {
            player.chips -= bet;
            player.currentBet = currentBet;
            pot += bet;
            return `AI ${player.name} calls ${bet}`;
        }
    }
    player.active = false;
    return `AI ${player.name} folds`;
}

function postBlinds() {
    const smallBlindPlayer = players[(dealerIndex + 1) % 4];
    const bigBlindPlayer = players[(dealerIndex + 2) % 4];
    if (smallBlindPlayer.chips >= smallBlind) {
        smallBlindPlayer.chips -= smallBlind;
        smallBlindPlayer.currentBet = smallBlind;
        pot += smallBlind;
    } else {
        smallBlindPlayer.active = false;
    }
    if (bigBlindPlayer.chips >= bigBlind) {
        bigBlindPlayer.chips -= bigBlind;
        bigBlindPlayer.currentBet = bigBlind;
        pot += bigBlind;
        currentBet = bigBlind;
    } else {
        bigBlindPlayer.active = false;
    }
    updateChipStack();
    document.getElementById('pot-amount').textContent = pot;
    players.forEach((p, i) => document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips);
}

function nextPhase() {
    if (gamePhase === 'pre-flop') {
        dealCommunityCards('flop');
        gamePhase = 'flop';
        document.getElementById('game-status').textContent = 'Flop';
    } else if (gamePhase === 'flop') {
        dealCommunityCards('turn');
        gamePhase = 'turn';
        document.getElementById('game-status').textContent = 'Turn';
    } else if (gamePhase === 'turn') {
        dealCommunityCards('river');
        gamePhase = 'river';
        document.getElementById('game-status').textContent = 'River';
    } else if (gamePhase === 'river') {
        const activePlayers = players.filter(p => p.active);
        const hands = activePlayers.map(p => ({ player: p, strength: evaluateHand(p.hand, communityCards) }));
        hands.sort((a, b) => b.strength.rank - a.strength.rank || values.indexOf(b.strength.value) - values.indexOf(a.strength.value));
        const winner = hands[0].player;
        winner.chips += pot;
        document.getElementById('game-status').textContent = `${winner.name} wins ${pot} chips!`;
        document.getElementById('pot-amount').textContent = 0;
        players.forEach((p, i) => document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips);
        pot = 0;
        gamePhase = 'pre-game';
        document.getElementById('actions').style.display = 'none';
        document.getElementById('game-status').innerHTML = 'Game Over. <button id="start-game">Start New Game</button>';
        document.getElementById('start-game').addEventListener('click', startGame);
    }
    currentBet = 0;
    players.forEach(p => p.currentBet = 0);
    runAITurns();
}

function runAITurns() {
    let index = (dealerIndex + 3) % 4; // Start after big blind
    const processNextAI = () => {
        if (index === 0 || gamePhase === 'pre-game') {
            if (players.filter(p => p.active).length <= 1 && gamePhase !== 'pre-game') {
                const winner = players.find(p => p.active);
                if (winner) {
                    winner.chips += pot;
                    document.getElementById('game-status').textContent = `${winner.name} wins ${pot} chips!`;
                    document.getElementById('pot-amount').textContent = 0;
                    players.forEach((p, i) => document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips);
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
            const action = aiDecision(players[index]);
            document.getElementById('game-status').textContent = action;
            document.getElementById('pot-amount').textContent = pot;
            players.forEach((p, i) => document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips);
        }
        index = (index + 1) % 4;
        if (index !== 0) {
            setTimeout(processNextAI, 1000);
        }
    };
    processNextAI();
}

function startGame() {
    players.forEach(p => { p.active = true; p.currentBet = 0; p.hand = []; p.mesh = []; });
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
    document.getElementById('game-status').textContent = 'New Round: Pre-flop';
    document.getElementById('pot-amount').textContent = pot;
    players.forEach((p, i) => document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips);
    document.getElementById('actions').style.display = 'block';
    runAITurns();
}

// UI event listeners
document.getElementById('fold').addEventListener('click', () => {
    players[0].active = false;
    document.getElementById('game-status').textContent = 'Player folds';
    nextPhase();
});

document.getElementById('call').addEventListener('click', () => {
    const bet = currentBet - (players[0].currentBet || 0);
    if (players[0].chips >= bet) {
        players[0].chips -= bet;
        players[0].currentBet = currentBet;
        pot += bet;
        document.getElementById('pot-amount').textContent = pot;
        players.forEach((p, i) => document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips);
        document.getElementById('game-status').textContent = 'Player calls';
        nextPhase();
    } else {
        document.getElementById('game-status').textContent = 'Not enough chips!';
    }
});

document.getElementById('raise').addEventListener('click', () => {
    const raiseAmount = parseInt(document.getElementById('raise-amount').value);
    const bet = currentBet - (players[0].currentBet || 0) + raiseAmount;
    if (players[0].chips >= bet && raiseAmount >= bigBlind) {
        players[0].chips -= bet;
        players[0].currentBet = currentBet + raiseAmount;
        currentBet = players[0].currentBet;
        pot += bet;
        document.getElementById('pot-amount').textContent = pot;
        players.forEach((p, i) => document.getElementById(`player-${i}`).querySelector('.player-chips').textContent = p.chips);
        document.getElementById('game-status').textContent = `Player raises to ${currentBet}`;
        runAITurns();
    } else {
        document.getElementById('game-status').textContent = 'Invalid raise amount or not enough chips!';
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    animateCardDealing();
    renderer.render(scene, camera);
}
animate();

// Initialize game
document.getElementById('game-status').innerHTML = '<button id="start-game">Start Game</button>';
document.getElementById('actions').style.display = 'none';
document.getElementById('start-game').addEventListener('click', startGame);