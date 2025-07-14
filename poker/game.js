const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

// Static top-down camera
camera.position.set(0, 10, 0); // Higher for better visibility
camera.lookAt(0, 0, 0);

// Lighting for realistic effect
const light = new THREE.DirectionalLight(0xffffff, 0.9);
light.position.set(5, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040, 0.5));

// Table setup
const textureLoader = new THREE.TextureLoader();
const tableTexture = textureLoader.load('table_texture.jpg', undefined, undefined, (err) => {
    console.error('Error loading table texture:', err);
});
tableTexture.minFilter = THREE.LinearFilter;
const tableGeometry = new THREE.PlaneGeometry(10, 5); // Larger oval table
const tableMaterial = new THREE.MeshPhongMaterial({ map: tableTexture });
const table = new THREE.Mesh(tableGeometry, tableMaterial);
table.rotation.x = -Math.PI / 2;
table.position.y = 0;
scene.add(table);

// Card data
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const deck = [];
suits.forEach(suit => values.forEach(value => deck.push({ suit, value })));
let communityCards = [];
let players = [
    { name: 'Player', chips: 1000, hand: [], active: true, mesh: [], currentBet: 0 },
    { name: 'AI 1', chips: 1000, hand: [], active: true, mesh: [], currentBet: 0 },
    { name: 'AI 2', chips: 1000, hand: [], active: true, mesh: [], currentBet: 0 },
    { name: 'AI 3', chips: 1000, hand: [], active: true, mesh: [], currentBet: 0 }
];
let pot = 0;
let currentBet = 0;
let gamePhase = 'pre-game';
let dealerIndex = 0;
let smallBlind = 5;
let bigBlind = 10;

// Card meshes
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
    const geometry = new THREE.PlaneGeometry(0.8, 1.2); // Larger cards
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);
    cardMeshes.push(mesh);
    return mesh;
}

function formatCardValue(value) {
    return value === 'A' ? 'ace' :
           value === 'K' ? 'king' :
           value === 'Q' ? 'queen' :
           value === 'J' ? 'jack' :
           value.toLowerCase();
}

// Game logic
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
            player.mesh.push(createCardMesh(player.hand[0], -1, 0.01, 3.5, true));
            player.mesh.push(createCardMesh(player.hand[1], -0.2, 0.01, 3.5, true));
        } else { // AI players around table
            const angle = (index * Math.PI / 2) + Math.PI / 2;
            const x = 4 * Math.cos(angle);
            const z = 4 * Math.sin(angle);
            player.mesh.push(createCardMesh(player.hand[0], x - 0.5, 0.01, z, false));
            player.mesh.push(createCardMesh(player.hand[1], x + 0.3, 0.01, z, false));
        }
    });
}

function dealCommunityCards(phase) {
    const positions = [
        { x: -1.6, y: 0.01, z: 0 }, // Flop 1
        { x: -0.8, y: 0.01, z: 0 }, // Flop 2
        { x: 0, y: 0.01, z: 0 }, // Flop 3
        { x: 0.8, y: 0.01, z: 0 }, // Turn
        { x: 1.6, y: 0.01, z: 0 } // River
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

function evaluateHand(hand, community) {
    const allCards = [...hand, ...community];
    const cardValues = allCards.map(card => card.value).sort((a, b) => values.indexOf(b) - values.indexOf(a));
    const suits = allCards.map(card => card.suit);
    const counts = {};
    cardValues.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const suitCounts = {};
    suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
    
    // Check for flush
    const flush = Object.values(suitCounts).some(count => count >= 5);
    // Simplified straight check
    const valueIndices = cardValues.map(v => values.indexOf(v)).sort((a, b) => a - b);
    let straight = false;
    for (let i = 0; i <= valueIndices.length - 5; i++) {
        if (valueIndices[i + 4] - valueIndices[i] === 4) {
            straight = true;
            break;
        }
    }
    // Ace-low straight (A,2,3,4,5)
    if (valueIndices.includes(12) && valueIndices.includes(0) && valueIndices.includes(1) && valueIndices.includes(2) && valueIndices.includes(3)) {
        straight = true;
    }

    const pairs = Object.values(counts).filter(c => c === 2).length;
    const three = Object.values(counts).some(c => c === 3);
    const four = Object.values(counts).some(c => c === 4);
    
    if (flush && straight) return { rank: 8, value: cardValues[0] }; // Straight flush
    if (four) return { rank: 7, value: Object.keys(counts).find(k => counts[k] === 4) }; // Four of a kind
    if (three && pairs >= 1) return { rank: 6, value: Object.keys(counts).find(k => counts[k] === 3) }; // Full house
    if (flush) return { rank: 5, value: cardValues[0] }; // Flush
    if (straight) return { rank: 4, value: cardValues[0] }; // Straight
    if (three) return { rank: 3, value: Object.keys(counts).find(k => counts[k] === 3) }; // Three of a kind
    if (pairs === 2) return { rank: 2, value: Object.keys(counts).find(k => counts[k] === 2) }; // Two pair
    if (pairs === 1) return { rank: 1, value: Object.keys(counts).find(k => counts[k] === 2) }; // Pair
    return { rank: 0, value: cardValues[0] }; // High card
}

function aiDecision(player) {
    const handStrength = evaluateHand(player.hand, communityCards).rank;
    const bet = currentBet - (player.currentBet || 0);
    const potOdds = bet / (pot + bet);
    const aggression = handStrength / 8; // Scale aggression based on hand strength
    
    if (handStrength >= 4 || (handStrength >= 2 && Math.random() < aggression) || (potOdds < 0.2 && Math.random() < 0.7)) {
        if (Math.random() < aggression * 0.4 && player.chips >= bet + bigBlind) {
            const raise = bet + bigBlind * 2;
            player.chips -= raise;
            player.currentBet += raise;
            currentBet = player.currentBet;
            pot += raise;
            return `AI ${player.name} raises to ${currentBet}`;
        } else if (player.chips >= bet) {
            player.chips -= bet;
            player.currentBet += bet;
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
    document.getElementById('pot').textContent = pot;
    document.getElementById('player-chips').textContent = players[0].chips;
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
        document.getElementById('player-chips').textContent = players[0].chips;
        document.getElementById('pot').textContent = 0;
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
        if (index === 0 || gamePhase === 'showdown' || gamePhase === 'pre-game') {
            if (players.filter(p => p.active).length <= 1 && gamePhase !== 'pre-game') {
                const winner = players.find(p => p.active);
                if (winner) {
                    winner.chips += pot;
                    document.getElementById('game-status').textContent = `${winner.name} wins ${pot} chips!`;
                    document.getElementById('player-chips').textContent = players[0].chips;
                    document.getElementById('pot').textContent = 0;
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
            document.getElementById('pot').textContent = pot;
            document.getElementById('player-chips').textContent = players[0].chips;
        }
        index = (index + 1) % 4;
        if (index !== 0) {
            setTimeout(processNextAI, 1000);
        }
    };
    processNextAI();
}

function startGame() {
    // Reset game state
    players.forEach(p => { p.active = true; p.currentBet = 0; p.hand = []; p.mesh = []; });
    communityCards = [];
    cardMeshes.forEach(mesh => scene.remove(mesh));
    cardMeshes.length = 0;
    pot = 0;
    currentBet = 0;
    gamePhase = 'pre-flop';
    dealerIndex = (dealerIndex + 1) % 4;
    
    // Post blinds and deal cards
    postBlinds();
    dealCards();
    
    document.getElementById('game-status').textContent = 'New Round: Pre-flop';
    document.getElementById('pot').textContent = pot;
    document.getElementById('player-chips').textContent = players[0].chips;
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
        players[0].currentBet += bet;
        pot += bet;
        document.getElementById('player-chips').textContent = players[0].chips;
        document.getElementById('pot').textContent = pot;
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
        players[0].currentBet += bet;
        currentBet = players[0].currentBet;
        pot += bet;
        document.getElementById('player-chips').textContent = players[0].chips;
        document.getElementById('pot').textContent = pot;
        document.getElementById('game-status').textContent = `Player raises to ${currentBet}`;
        runAITurns();
    } else {
        document.getElementById('game-status').textContent = 'Invalid raise amount or not enough chips!';
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Initialize game
document.getElementById('game-status').innerHTML = '<button id="start-game">Start Game</button>';
document.getElementById('actions').style.display = 'none';
document.getElementById('start-game').addEventListener('click', startGame);