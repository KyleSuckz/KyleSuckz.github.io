const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(0, 4, 8);
controls.update();

const light = new THREE.DirectionalLight(0xffffff, 0.8);
light.position.set(0, 10, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Load table texture
const textureLoader = new THREE.TextureLoader();
const tableTexture = textureLoader.load('table_texture.jpg');
const tableGeometry = new THREE.PlaneGeometry(6, 3); // Oval-like table
const tableMaterial = new THREE.MeshPhongMaterial({ map: tableTexture });
const table = new THREE.Mesh(tableGeometry, tableMaterial);
table.rotation.x = -Math.PI / 2; // Lay flat
table.position.y = 0;
scene.add(table);

// Card data
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const deck = [];
suits.forEach(suit => values.forEach(value => deck.push({ suit, value })));
let communityCards = [];
let players = [
    { name: 'Player', chips: 1000, hand: [], active: true, mesh: [] },
    { name: 'AI 1', chips: 1000, hand: [], active: true, mesh: [] },
    { name: 'AI 2', chips: 1000, hand: [], active: true, mesh: [] },
    { name: 'AI 3', chips: 1000, hand: [], active: true, mesh: [] }
];
let pot = 0;
let currentBet = 0;
let gamePhase = 'pre-game';
let dealerIndex = 0;
let gameStarted = false;

// Card meshes
const cardMeshes = [];
const cardBackTexture = textureLoader.load('cards/card_back.png');
function createCardMesh(card, x, y, z, isFaceUp = true) {
    const texture = isFaceUp ? textureLoader.load(`cards/${formatCardValue(card.value)}_of_${card.suit}.png`) : cardBackTexture;
    const geometry = new THREE.PlaneGeometry(0.5, 0.7);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.x = -Math.PI / 2; // Lay flat on table
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
        if (index === 0) { // Player
            player.mesh.push(createCardMesh(player.hand[0], -0.6, 0.01, 2.5, true));
            player.mesh.push(createCardMesh(player.hand[1], -0.1, 0.01, 2.5, true));
        } else { // AI players
            const angle = (index * Math.PI / 2) + Math.PI / 2; // Position around table
            const x = 2.5 * Math.cos(angle);
            const z = 2.5 * Math.sin(angle);
            player.mesh.push(createCardMesh(player.hand[0], x - 0.3, 0.01, z, false));
            player.mesh.push(createCardMesh(player.hand[1], x + 0.2, 0.01, z, false));
        }
    });
}

function dealCommunityCards(phase) {
    const positions = [
        { x: -1, y: 0.01, z: 0 }, // Flop 1
        { x: -0.5, y: 0.01, z: 0 }, // Flop 2
        { x: 0, y: 0.01, z: 0 }, // Flop 3
        { x: 0.5, y: 0.01, z: 0 }, // Turn
        { x: 1, y: 0.01, z: 0 } // River
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
    const pairs = Object.values(counts).filter(c => c === 2).length;
    const three = Object.values(counts).filter(c => c === 3).length;
    if (three) return { rank: 3, value: Object.keys(counts).find(k => counts[k] === 3) }; // Three of a kind
    if (pairs === 2) return { rank: 2, value: Object.keys(counts).find(k => counts[k] === 2) }; // Two pair
    if (pairs === 1) return { rank: 1, value: Object.keys(counts).find(k => counts[k] === 2) }; // Pair
    return { rank: 0, value: cardValues[0] }; // High card
}

function aiDecision(player) {
    const handStrength = evaluateHand(player.hand, communityCards).rank;
    const bet = currentBet - (player.currentBet || 0);
    if (handStrength >= 2 || Math.random() > 0.5) {
        if (Math.random() > 0.3 && player.chips >= bet + 10) {
            const raise = bet + 10;
            player.chips -= raise;
            currentBet = raise;
            pot += raise;
            return `AI ${player.name} raises to ${currentBet}`;
        } else if (player.chips >= bet) {
            player.chips -= bet;
            pot += bet;
            return `AI ${player.name} calls ${bet}`;
        }
    }
    player.active = false;
    return `AI ${player.name} folds`;
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
    let index = (dealerIndex + 1) % 4;
    const processNextAI = () => {
        if (index === 0 || gamePhase === 'showdown' || gamePhase === 'pre-game') return;
        if (players[index].active) {
            const action = aiDecision(players[index]);
            document.getElementById('game-status').textContent = action;
        }
        index = (index + 1) % 4;
        if (index !== 0) {
            setTimeout(processNextAI, 1000);
        }
    };
    processNextAI();
}

function startGame() {
    gameStarted = true;
    dealerIndex = (dealerIndex + 1) % 4;
    players.forEach(p => { p.active = true; p.currentBet = 0; });
    gamePhase = 'pre-flop';
    pot = 0;
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
        pot += bet;
        players[0].currentBet = currentBet;
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
    if (players[0].chips >= bet) {
        players[0].chips -= bet;
        pot += bet;
        currentBet = bet;
        players[0].currentBet = currentBet;
        document.getElementById('player-chips').textContent = players[0].chips;
        document.getElementById('pot').textContent = pot;
        document.getElementById('game-status').textContent = `Player raises to ${currentBet}`;
        runAITurns();
    } else {
        document.getElementById('game-status').textContent = 'Not enough chips!';
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Initialize game
document.getElementById('game-status').innerHTML = '<button id="start-game">Start Game</button>';
document.getElementById('actions').style.display = 'none';
document.getElementById('start-game').addEventListener('click', startGame);