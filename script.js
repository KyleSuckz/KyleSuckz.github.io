const SUITS = ['♠', '♥', '♣', '♦'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const DECK = SUITS.flatMap(suit => RANKS.map(rank => ({ suit, rank })));
const ALL_PLAYERS = ['player', 'player1', 'player2', 'player3'];
const HAND_NAMES = ['High Card', 'Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush'];
const BLINDS = { small: 25, big: 50 };
const MIN_RAISE = BLINDS.big * 2;
const CARD_SIZE = { width: 'clamp(40px, 6.2vw, 62px)', height: 'clamp(56px, 8.7vw, 87px)' };

/**
 * Debounce utility to limit function execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Game rendering logic
 */
const render = {
    DOM: {},
    lastWinnerText: '',
    actionButtonsState: { parent: null, nextSibling: null },

    /**
     * Initializes DOM references
     */
    initDOM() {
        this.DOM = {
            communityCards: document.getElementById('community-cards'),
            playerCards: document.getElementById('player-cards'),
            player1Cards: document.getElementById('player1-cards'),
            player2Cards: document.getElementById('player2-cards'),
            player3Cards: document.getElementById('player3-cards'),
            playerHand: document.getElementById('player-hand'),
            player1Hand: document.getElementById('player1-hand'),
            player2Hand: document.getElementById('player2-hand'),
            player3Hand: document.getElementById('player3-hand'),
            pot: document.getElementById('pot'),
            currentBet: document.getElementById('current-bet'),
            callInfo: document.getElementById('call-info'),
            gameStatus: document.getElementById('game-status'),
            startButton: document.getElementById('start-game'),
            continueButton: document.getElementById('continue-game'),
            foldButton: document.getElementById('fold'),
            checkCallButton: document.getElementById('check-call'),
            raiseButton: document.getElementById('raise'),
            raiseAmount: document.getElementById('raise-amount'),
            winningHand: document.getElementById('winning-hand'),
            actionButtons: document.querySelector('.action-buttons'),
            primaryControls: document.querySelector('.primary-controls'),
            actionText: document.getElementById('action-text'),
            actionLog: document.getElementById('action-log'),
            logToggle: document.getElementById('log-toggle'),
            resetGameButton: document.getElementById('reset-game'),
            players: [
                document.getElementById('player'),
                document.getElementById('player1'),
                document.getElementById('player2'),
                document.getElementById('player3')
            ],
            dealerButtons: [
                document.getElementById('player-dealer'),
                document.getElementById('player1-dealer'),
                document.getElementById('player2-dealer'),
                document.getElementById('player3-dealer')
            ],
            blindChips: [
                document.getElementById('player-blind'),
                document.getElementById('player1-blind'),
                document.getElementById('player2-blind'),
                document.getElementById('player3-blind')
            ],
            playerChips: document.getElementById('player-chips'),
            player1Chips: document.getElementById('player1-chips'),
            player2Chips: document.getElementById('player2-chips'),
            player3Chips: document.getElementById('player3-chips')
        };
    },

    /**
     * Renders a card element
     * @param {Object} card - Card with suit and rank
     * @param {boolean} hidden - Whether to hide the card
     * @returns {HTMLElement} Card element
     */
    renderCard({ suit, rank }, hidden = false) {
        const div = document.createElement('div');
        div.className = `card ${hidden ? 'back' : suit === '♥' || suit === '♦' ? 'red' : 'black'}`;
        div.innerHTML = hidden ? '' : `<div class="card-content">${rank}<br>${suit}</div>`;
        div.setAttribute('aria-label', hidden ? 'Hidden card' : `${rank} of ${suit}`);
        Object.assign(div.style, CARD_SIZE);
        return div;
    },

    /**
     * Enables control buttons
     */
    enableControls() {
        ['foldButton', 'checkCallButton', 'raiseButton', 'raiseAmount'].forEach(key => {
            this.DOM[key].disabled = false;
        });
        this.validateRaiseAmount();
    },

    /**
     * Disables control buttons
     */
    disableControls() {
        ['foldButton', 'checkCallButton', 'raiseButton', 'raiseAmount'].forEach(key => {
            this.DOM[key].disabled = true;
        });
    },

    /**
     * Updates community cards
     */
    updateCommunityCards() {
        this.DOM.communityCards.innerHTML = '';
        gameLogic.state.communityCards.forEach(card => {
            this.DOM.communityCards.appendChild(this.renderCard(card));
        });
    },

    /**
     * Updates player cards and hands
     */
    updatePlayerCards() {
        const hands = gameLogic.state.players.reduce((acc, p) => {
            const cards = [...p.cards, ...gameLogic.state.communityCards];
            return { ...acc, [p.id]: cards.length >= 2 ? gameLogic.evaluateHand(cards) : { score: -1, high: -1, tiebreakers: [], cards: [] } };
        }, {});

        const players = [
            { id: 'player', cardsDiv: this.DOM.playerCards, handDiv: this.DOM.playerHand, hidden: false, showHand: true },
            { id: 'player1', cardsDiv: this.DOM.player1Cards, handDiv: this.DOM.player1Hand, hidden: !(gameLogic.state.phase === 'showdown' || gameLogic.getChips('player1') === 0 || gameLogic.state.allInPlayers.has('player1') || gameLogic.state.foldedPlayers.has('player1')), showHand: gameLogic.state.phase === 'showdown' || gameLogic.getChips('player1') === 0 || gameLogic.state.allInPlayers.has('player1') },
            { id: 'player2', cardsDiv: this.DOM.player2Cards, handDiv: this.DOM.player2Hand, hidden: !(gameLogic.state.phase === 'showdown' || gameLogic.getChips('player2') === 0 || gameLogic.state.allInPlayers.has('player2') || gameLogic.state.foldedPlayers.has('player2')), showHand: gameLogic.state.phase === 'showdown' || gameLogic.getChips('player2') === 0 || gameLogic.state.allInPlayers.has('player2') },
            { id: 'player3', cardsDiv: this.DOM.player3Cards, handDiv: this.DOM.player3Hand, hidden: !(gameLogic.state.phase === 'showdown' || gameLogic.getChips('player3') === 0 || gameLogic.state.allInPlayers.has('player3') || gameLogic.state.foldedPlayers.has('player3')), showHand: gameLogic.state.phase === 'showdown' || gameLogic.getChips('player3') === 0 || gameLogic.state.allInPlayers.has('player3') }
        ];

        players.forEach(({ id, cardsDiv, handDiv, hidden, showHand }) => {
            cardsDiv.innerHTML = '';
            const playerData = gameLogic.getPlayer(id);
            playerData.cards.forEach(card => cardsDiv.appendChild(this.renderCard(card, hidden)));
            handDiv.textContent = showHand && hands[id].score > -1 ? gameLogic.getHandDescription(hands[id]) : '';
            handDiv.classList.toggle('visible', showHand && hands[id].score > -1);
            handDiv.setAttribute('aria-label', `${gameLogic.getPlayerName(id)} best hand: ${showHand && hands[id].score > -1 ? gameLogic.getHandDescription(hands[id]) : 'Not visible'}`);
            cardsDiv.classList.toggle('your-turn', gameLogic.state.currentTurn === id && gameLogic.state.phase !== 'showdown' && !gameLogic.state.allInPlayers.has(id));
        });
    },

    /**
     * Updates folded overlays
     */
    updateFoldedOverlays() {
        this.DOM.players.forEach((playerDiv, idx) => {
            const id = ALL_PLAYERS[idx];
            const existingOverlay = playerDiv.querySelector('.folded-overlay');
            if (gameLogic.state.foldedPlayers.has(id) && !existingOverlay) {
                const overlay = document.createElement('div');
                overlay.className = 'folded-overlay';
                overlay.textContent = 'X';
                overlay.setAttribute('aria-hidden', 'true');
                playerDiv.appendChild(overlay);
            } else if (existingOverlay && !gameLogic.state.foldedPlayers.has(id)) {
                existingOverlay.remove();
            }
        });
    },

    /**
     * Updates dealer and blind indicators
     */
    updateIndicators() {
        this.DOM.players.forEach((_, idx) => {
            const id = ALL_PLAYERS[idx];
            this.DOM.dealerButtons[idx].style.display = id === gameLogic.state.dealer ? 'block' : 'none';
            const blindChip = this.DOM.blindChips[idx];
            blindChip.classList.remove('hidden');
            const playerData = gameLogic.getPlayer(id);
            if (id === gameLogic.state.smallBlindPlayer && playerData.totalBet > 0) {
                blindChip.textContent = `SB ${BLINDS.small}`;
                blindChip.style.display = 'block';
            } else if (id === gameLogic.state.bigBlindPlayer && playerData.totalBet > 0) {
                blindChip.textContent = `BB ${BLINDS.big}`;
                blindChip.style.display = 'block';
            } else {
                blindChip.style.display = 'none';
            }
        });
    },

    /**
     * Updates game information
     */
    updateGameInfo() {
        const toCall = gameLogic.state.currentBet - (gameLogic.getPlayer(gameLogic.state.currentTurn)?.betThisRound || 0);
        this.DOM.pot.textContent = `Total Pot: ${gameLogic.state.pot}`;
        this.DOM.pot.setAttribute('aria-label', `Total pot: ${gameLogic.state.pot}`);
        this.DOM.currentBet.textContent = `Current Bet: ${gameLogic.state.currentBet}`;
        this.DOM.currentBet.setAttribute('aria-label', `Current bet: ${gameLogic.state.currentBet}`);
        this.DOM.callInfo.textContent = `To Call: ${toCall}`;
        this.DOM.callInfo.setAttribute('aria-label', `Amount to call: ${toCall}`);
        this.DOM.gameStatus.textContent = gameLogic.state.isFirstGame ? 'Ready to start' : `Phase: ${gameLogic.state.phase.charAt(0).toUpperCase() + gameLogic.state.phase.slice(1)}, Turn: ${gameLogic.getPlayerName(gameLogic.state.currentTurn)}`;
        this.DOM.gameStatus.setAttribute('aria-label', gameLogic.state.isFirstGame ? 'Ready to start' : `Phase: ${gameLogic.state.phase}, Turn: ${gameLogic.getPlayerName(gameLogic.state.currentTurn)}`);

        let actionText = gameLogic.state.isFirstGame ? 'Waiting to start.' : '';
        let ariaLabel = 'Waiting to start';
        const latestAction = gameLogic.state.actionLog[0]?.replace(/^\[\d{2}:\d{2}:\d{2}\s*[AP]M\]: /, '');

        if ((gameLogic.state.phase === 'showdown' || gameLogic.state.playersInRound.size <= 1) && this.lastWinnerText) {
            actionText = this.lastWinnerText;
            ariaLabel = `Result: ${actionText}`;
            this.DOM.winningHand.classList.remove('your-turn-blink');
        } else if (gameLogic.state.currentTurn === 'player' && gameLogic.state.phase !== 'showdown' && !gameLogic.state.allInPlayers.has('player')) {
            const hand = gameLogic.evaluateHand([...gameLogic.getPlayer('player').cards, ...gameLogic.state.communityCards]);
            actionText = `${gameLogic.getHandDescription(hand)} (${toCall > 0 ? `Call: ${toCall}` : 'Check'})`;
            ariaLabel = `Your hand: ${actionText}`;
            this.DOM.winningHand.classList.add('your-turn-blink');
        } else if (gameLogic.state.currentTurn !== 'none' && gameLogic.state.phase !== 'showdown' && !gameLogic.state.allInPlayers.has(gameLogic.state.currentTurn)) {
            actionText = `${gameLogic.getPlayerName(gameLogic.state.currentTurn)}'s turn (${gameLogic.getPlayerOptions(gameLogic.state.currentTurn).replace(/^[^:]+:\s*/, '')})`;
            ariaLabel = `Action: ${actionText}`;
            this.DOM.winningHand.classList.remove('your-turn-blink');
        } else if (latestAction && /folded|checked|called|raised to|posted small blind|posted big blind|is all-in|shows/.test(latestAction)) {
            actionText = latestAction;
            ariaLabel = `Action: ${latestAction}`;
            this.DOM.winningHand.classList.remove('your-turn-blink');
        } else if (this.lastWinnerText) {
            actionText = this.lastWinnerText;
            ariaLabel = `Result: ${actionText}`;
            this.DOM.winningHand.classList.remove('your-turn-blink');
        }

        this.DOM.winningHand.textContent = actionText;
        this.DOM.winningHand.setAttribute('aria-label', ariaLabel);
    },

    /**
     * Updates chip counts
     */
    updateChips() {
        gameLogic.state.players.forEach((player, idx) => {
            const chipDiv = this.DOM[`player${idx === 0 ? '' : idx}Chips`];
            chipDiv.textContent = `Chips: ${player.chips}`;
            chipDiv.setAttribute('aria-label', `${gameLogic.getPlayerName(player.id)} chips: ${player.chips}`);
        });
    },

    /**
     * Manages action buttons visibility
     */
    updateActionButtons() {
        const isPlayerTurn = gameLogic.state.currentTurn === 'player' && gameLogic.state.phase !== 'showdown' && !gameLogic.state.allInPlayers.has('player');
        const isRoundEnded = gameLogic.state.phase === 'showdown' || gameLogic.state.playersInRound.size <= 1;

        this.DOM.startButton.hidden = !gameLogic.state.isFirstGame;
        this.DOM.startButton.disabled = false;
        this.DOM.continueButton.hidden = !isRoundEnded;
        this.DOM.continueButton.disabled = !isRoundEnded;
        this.DOM.resetGameButton.disabled = isPlayerTurn;

        // Show action-buttons if both startButton and continueButton are hidden, or if it's the player's turn
        if (this.DOM.startButton.hidden && this.DOM.continueButton.hidden) {
            this.DOM.actionButtons.classList.add('active');
        } else {
            this.DOM.actionButtons.classList.toggle('active', isPlayerTurn);
        }

        if (isPlayerTurn) {
            this.enableControls();
            if (!this.actionButtonsState.parent) {
                this.actionButtonsState.parent = this.DOM.actionButtons.parentNode;
                this.actionButtonsState.nextSibling = this.DOM.actionButtons.nextSibling;
            }
            this.DOM.primaryControls.insertBefore(this.DOM.actionButtons, this.DOM.winningHand.nextSibling);
        } else {
            this.disableControls();
            if (this.actionButtonsState.parent) {
                this.actionButtonsState.parent.insertBefore(this.DOM.actionButtons, this.actionButtonsState.nextSibling);
                this.actionButtonsState = { parent: null, nextSibling: null };
            }
        }
    },

    /**
     * Updates the game display
     */
    updateGameDisplay() {
        requestAnimationFrame(() => {
            this.updateCommunityCards();
            this.updatePlayerCards();
            this.updateFoldedOverlays();
            this.updateIndicators();
            this.updateGameInfo();
            this.updateChips();
            this.updateActionButtons();
            this.renderLog();
        });
    },

    /**
     * Validates raise amount input
     */
    validateRaiseAmount() {
        const minRaise = Math.max(gameLogic.state.minRaise, gameLogic.state.currentBet + BLINDS.big);
        const toCall = gameLogic.state.currentBet - (gameLogic.getPlayer('player')?.betThisRound || 0);
        const maxRaise = gameLogic.getChips('player') + toCall;
        let value = Math.max(minRaise, Math.min(maxRaise, parseInt(this.DOM.raiseAmount.value) || minRaise));
        this.DOM.raiseAmount.value = Math.floor(value / 25) * 25;
        this.DOM.raiseAmount.classList.toggle('invalid', value < minRaise || value > maxRaise);
        this.DOM.raiseButton.disabled = gameLogic.state.phase === 'showdown' || gameLogic.state.currentTurn !== 'player' || value < minRaise || value > maxRaise || gameLogic.state.playersInRound.size <= 1;
    },

    /**
     * Logs an action with timestamp
     * @param {string} action - Action to log
     */
    logAction(action) {
        const timestamp = new Date().toLocaleTimeString();
        gameLogic.state.actionLog.unshift(`[${timestamp}]: ${action}`);
        if (gameLogic.state.actionLog.length > 200) gameLogic.state.actionLog.pop();
        if (action.includes('won') && (action.includes('chips with') || action.includes('as all others folded'))) {
            this.lastWinnerText = action.replace(/^\[\d{2}:\d{2}:\d{2}\s*[AP]M\]: /, '');
        }
        this.renderLog();
    },

    /**
     * Renders the action log
     */
    renderLog() {
        this.DOM.actionText.innerHTML = '';
        gameLogic.state.actionLog.forEach(log => {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            if (log.includes('--- New Game Started ---') || log.includes('--- Game Reset ---')) {
                entry.classList.add('separator');
            }
            entry.textContent = log;
            this.DOM.actionText.appendChild(entry);
        });
    }
};

render.debouncedUpdateGameDisplay = debounce(render.updateGameDisplay.bind(render), 100);

/**
 * Game logic and state management
 */
const gameLogic = {
    state: {
        deck: [...DECK],
        communityCards: [],
        pot: 0,
        currentBet: 0,
        minRaise: MIN_RAISE,
        phase: 'preflop',
        playersInRound: new Set(ALL_PLAYERS),
        foldedPlayers: new Set(),
        allInPlayers: new Set(),
        currentTurn: 'none',
        dealer: 'player3',
        smallBlindPlayer: null,
        bigBlindPlayer: null,
        actionLog: [],
        isFirstGame: true,
        sidePots: [],
        players: ALL_PLAYERS.map(id => ({
            id,
            chips: 1000,
            cards: [],
            betThisRound: 0,
            totalBet: 0,
            wins: 0,
            folds: 0,
            hasActed: false
        }))
    },
    handCache: new Map(),
    rankValues: new Map(RANKS.map((rank, idx) => [rank, idx])),

    /**
     * Shuffles an array
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    /**
     * Ensures deck has enough cards
     * @param {number} count - Number of cards needed
     */
    ensureDeckSize(count) {
        if (this.state.deck.length < count) {
            this.state.deck = this.shuffle([...DECK]);
            render.logAction('Deck reshuffled.');
        }
    },

    /**
     * Gets a player by ID
     * @param {string} id - Player ID
     * @returns {Object|null} Player object
     */
    getPlayer(id) {
        return this.state.players.find(p => p.id === id) || null;
    },

    /**
     * Gets player's chip count
     * @param {string} id - Player ID
     * @returns {number} Chip count
     */
    getChips(id) {
        return this.getPlayer(id)?.chips || 0;
    },

    /**
     * Sets player's chip count
     * @param {string} id - Player ID
     * @param {number} amount - Chip amount
     */
    setChips(id, amount) {
        const player = this.getPlayer(id);
        if (player) player.chips = Math.max(0, amount);
    },

    /**
     * Gets player display name
     * @param {string} id - Player ID
     * @returns {string} Player name
     */
    getPlayerName(id) {
        return id === 'player' ? 'You' : `Player ${ALL_PLAYERS.indexOf(id)}`;
    },

    /**
     * Evaluates a poker hand
     * @param {Object[]} cards - Array of card objects
     * @returns {Object} Hand evaluation result
     */
    evaluateHand(cards) {
        const cacheKey = cards.map(c => `${c.rank}${c.suit}`).sort().join('|');
        if (this.handCache.has(cacheKey)) return this.handCache.get(cacheKey);

        const rankCount = cards.reduce((acc, c) => ({ ...acc, [c.rank]: (acc[c.rank] || 0) + 1 }), {});
        const suitCount = cards.reduce((acc, c) => ({ ...acc, [c.suit]: (acc[c.suit] || 0) + 1 }), {});
        const sortedRanks = cards.map(c => this.rankValues.get(c.rank)).sort((a, b) => b - a);
        const uniqueRanks = [...new Set(sortedRanks)];
        const isFlush = Object.values(suitCount).some(count => count >= 5);
        const isStraight = uniqueRanks.length >= 5 && (
            uniqueRanks[0] - uniqueRanks[4] === 4 ||
            (uniqueRanks.includes(12) && uniqueRanks.slice(-4).every((v, i) => v === i))
        );

        let bestHand = { score: 0, high: sortedRanks[0] || 0, tiebreakers: sortedRanks.slice(1), cards };
        const four = Object.entries(rankCount).find(([_, count]) => count === 4);
        const three = Object.entries(rankCount).find(([_, count]) => count === 3);
        const pairs = Object.entries(rankCount).filter(([_, count]) => count === 2).map(([r]) => this.rankValues.get(r)).sort((a, b) => b - a);

        if (isFlush && isStraight) {
            const flushSuit = Object.keys(suitCount).find(s => suitCount[s] >= 5);
            const flushCards = cards.filter(c => c.suit === flushSuit).sort((a, b) => this.rankValues.get(b.rank) - this.rankValues.get(a.rank));
            const flushRanks = flushCards.map(c => this.rankValues.get(c.rank)).sort((a, b) => b - a);
            let straightHigh = -1;
            for (let i = 0; i <= flushRanks.length - 5; i++) {
                if (flushRanks[i] - flushRanks[i + 4] === 4) {
                    straightHigh = flushRanks[i];
                    break;
                }
            }
            if (straightHigh === -1 && flushRanks.includes(12) && flushRanks.slice(-4).every((v, i) => v === i)) {
                straightHigh = flushRanks[flushRanks.length - 5] || 3;
            }
            if (straightHigh >= 0) {
                const straightCards = flushCards.filter(c => {
                    const rankVal = this.rankValues.get(c.rank);
                    return rankVal <= straightHigh && rankVal >= straightHigh - 4;
                }).slice(0, 5);
                bestHand = { score: 8, high: straightHigh, tiebreakers: [], cards: straightCards };
            }
        } else if (four) {
            const fourCards = cards.filter(c => c.rank === four[0]).slice(0, 4);
            const kickerCards = cards.filter(c => c.rank !== four[0]).sort((a, b) => this.rankValues.get(b.rank) - this.rankValues.get(a.rank)).slice(0, 1);
            bestHand = { score: 7, high: this.rankValues.get(four[0]), tiebreakers: kickerCards.map(c => this.rankValues.get(c.rank)), cards: [...fourCards, ...kickerCards] };
        } else if (three && pairs.length) {
            const threeCards = cards.filter(c => c.rank === three[0]).slice(0, 3);
            const pairCards = cards.filter(c => c.rank === RANKS[pairs[0]]).slice(0, 2);
            bestHand = { score: 6, high: this.rankValues.get(three[0]), tiebreakers: [pairs[0]], cards: [...threeCards, ...pairCards] };
        } else if (isFlush) {
            const flushSuit = Object.keys(suitCount).find(s => suitCount[s] >= 5);
            const flushCards = cards.filter(c => c.suit === flushSuit).sort((a, b) => this.rankValues.get(b.rank) - this.rankValues.get(a.rank)).slice(0, 5);
            bestHand = { score: 5, high: this.rankValues.get(flushCards[0].rank), tiebreakers: flushCards.slice(1).map(c => this.rankValues.get(c.rank)), cards: flushCards };
        } else if (isStraight) {
            let straightHigh = uniqueRanks[0];
            if (uniqueRanks.includes(12) && uniqueRanks.slice(-4).every((v, i) => v === i)) {
                straightHigh = uniqueRanks[uniqueRanks.length - 5] || 3;
            }
            const straightCards = cards.filter(c => {
                const rankVal = this.rankValues.get(c.rank);
                return rankVal <= straightHigh && rankVal >= straightHigh - 4;
            }).slice(0, 5);
            bestHand = { score: 4, high: straightHigh, tiebreakers: [], cards: straightCards };
        } else if (three) {
            const threeCards = cards.filter(c => c.rank === three[0]).slice(0, 3);
            const kickerCards = cards.filter(c => c.rank !== three[0]).sort((a, b) => this.rankValues.get(b.rank) - this.rankValues.get(a.rank)).slice(0, 2);
            bestHand = { score: 3, high: this.rankValues.get(three[0]), tiebreakers: kickerCards.map(c => this.rankValues.get(c.rank)), cards: [...threeCards, ...kickerCards] };
        } else if (pairs.length >= 2) {
            const pairCards = cards.filter(c => c.rank === RANKS[pairs[0]] || c.rank === RANKS[pairs[1]]).slice(0, 4);
            const kickerCards = cards.filter(c => c.rank !== RANKS[pairs[0]] && c.rank !== RANKS[pairs[1]]).sort((a, b) => this.rankValues.get(b.rank) - this.rankValues.get(a.rank)).slice(0, 1);
            bestHand = { score: 2, high: Math.max(...pairs), tiebreakers: [Math.min(...pairs), ...kickerCards.map(c => this.rankValues.get(c.rank))], cards: [...pairCards, ...kickerCards] };
        } else if (pairs.length === 1) {
            const pairCards = cards.filter(c => c.rank === RANKS[pairs[0]]).slice(0, 2);
            const kickerCards = cards.filter(c => c.rank !== RANKS[pairs[0]]).sort((a, b) => this.rankValues.get(b.rank) - this.rankValues.get(a.rank)).slice(0, 3);
            bestHand = { score: 1, high: pairs[0], tiebreakers: kickerCards.map(c => this.rankValues.get(c.rank)), cards: [...pairCards, ...kickerCards] };
        } else {
            const highCards = cards.sort((a, b) => this.rankValues.get(b.rank) - this.rankValues.get(a.rank)).slice(0, 5);
            bestHand = { score: 0, high: this.rankValues.get(highCards[0]?.rank || '2'), tiebreakers: highCards.slice(1).map(c => this.rankValues.get(c.rank)), cards: highCards };
        }

        this.handCache.set(cacheKey, bestHand);
        return bestHand;
    },

    /**
     * Gets hand description
     * @param {Object} hand - Hand evaluation result
     * @returns {string} Hand description
     */
    getHandDescription(hand) {
        const highCard = RANKS[hand.high] || 'Unknown';
        switch (hand.score) {
            case 8: return `Straight Flush, ${highCard} high`;
            case 7: return `Four of a Kind, ${highCard}s`;
            case 6: return `Full House, ${highCard}s over ${RANKS[hand.tiebreakers[0]] || 'Unknown'}s`;
            case 5: return `Flush, ${highCard} high`;
            case 4: return `Straight, ${highCard} high`;
            case 3: return `Three of a Kind, ${highCard}s`;
            case 2: return `Two Pair, ${highCard}s and ${RANKS[hand.tiebreakers[0]] || 'Unknown'}s`;
            case 1: return `Pair of ${highCard}s`;
            default: return `High Card ${highCard}`;
        }
    },

    /**
     * Gets available actions for a player
     * @param {string} id - Player ID
     * @returns {string} Available actions
     */
    getPlayerOptions(id) {
        const player = this.getPlayer(id);
        if (!player || this.state.allInPlayers.has(id)) return `${this.getPlayerName(id)}: None${this.state.allInPlayers.has(id) ? ' (all-in)' : ''}`;
        const toCall = this.state.currentBet - player.betThisRound;
        const minRaise = Math.max(this.state.minRaise, this.state.currentBet + BLINDS.big);
        const options = ['Fold'];
        if (toCall === 0) options.push('Check');
        else if (player.chips >= toCall) options.push(`Call ${toCall}`);
        if (player.chips >= minRaise) options.push('Raise');
        return `${this.getPlayerName(id)}: ${options.join(', ')}`;
    },

    /**
     * Logs current chip counts
     */
    logChipCounts() {
        render.logAction(`Chips: ${this.state.players.map(p => `${this.getPlayerName(p.id)}: ${p.chips}`).join(', ')}`);
    },

    /**
     * Verifies total chips in the game
     * @returns {boolean} Whether total chips equal 4000
     */
    verifyChipTotal() {
        const totalChips = this.state.players.reduce((sum, p) => sum + p.chips, 0) + this.state.pot;
        console.log(`Total chips: ${totalChips}, Pot: ${this.state.pot}, Players: ${this.state.players.map(p => `${p.id}:${p.chips}`).join(', ')}`);
        return totalChips === 4000;
    },

    /**
     * Processes a player's bet
     * @param {string} id - Player ID
     * @param {number} amount - Bet amount
     * @param {boolean} isRaise - Whether it's a raise
     * @param {boolean} isBlind - Whether it's a blind
     * @returns {boolean} Success status
     */
    makeBet(id, amount, isRaise = false, isBlind = false) {
        const player = this.getPlayer(id);
        if (!player || player.chips <= 0 || this.state.foldedPlayers.has(id)) {
            if (!isBlind) {
                this.state.playersInRound.delete(id);
                this.state.foldedPlayers.add(id);
                player.folds++;
                render.logAction(`${this.getPlayerName(id)} folded (no chips).`);
            }
            return false;
        }

        const toCall = isBlind ? 0 : Math.max(0, this.state.currentBet - player.betThisRound);
        const totalBet = isBlind ? Math.min(amount, player.chips) : isRaise ? Math.min(amount, player.chips) : Math.min(toCall, player.chips);

        if (totalBet === player.chips && !this.state.allInPlayers.has(id)) {
            this.state.allInPlayers.add(id);
            render.logAction(`${this.getPlayerName(id)} is all-in with ${totalBet} chips.`);
        }

        player.chips -= totalBet;
        player.betThisRound += totalBet;
        player.totalBet += totalBet;
        this.state.pot += totalBet;

        console.log(`makeBet: ${this.getPlayerName(id)} bet ${totalBet}, pot=${this.state.pot}, chips=${player.chips}`);

        if (isBlind) {
            render.logAction(`${this.getPlayerName(id)} posted ${isRaise ? 'big blind' : 'small blind'}: ${totalBet}`);
        } else if (totalBet > 0 && !isRaise) {
            render.logAction(`${this.getPlayerName(id)} called ${toCall}${totalBet < toCall ? ' (all-in)' : ''}`);
        }

        if (isRaise && !isBlind) {
            this.state.currentBet = player.betThisRound;
            this.state.minRaise = Math.max(this.state.minRaise, totalBet + BLINDS.big);
            this.state.playersInRound.forEach(p => {
                if (p !== id && !this.state.allInPlayers.has(p) && !this.state.foldedPlayers.has(p)) {
                    this.getPlayer(p).hasActed = false;
                }
            });
        }

        player.hasActed = !isBlind;
        return true;
    },

    /**
     * Creates side pots for all-in situations
     */
    createSidePots() {
        this.state.sidePots = [];
        const bets = this.state.players
            .filter(p => p.totalBet > 0 && !this.state.foldedPlayers.has(p.id) && (this.state.playersInRound.has(p.id) || this.state.allInPlayers.has(p.id)))
            .map(p => ({ id: p.id, bet: p.totalBet }))
            .sort((a, b) => a.bet - b.bet);
        let previousBet = 0;

        bets.forEach(({ id, bet }) => {
            if (bet > previousBet) {
                const potAmount = (bet - previousBet) * this.state.players
                    .filter(p => p.totalBet >= bet && !this.state.foldedPlayers.has(p.id) && (this.state.playersInRound.has(p.id) || this.state.allInPlayers.has(p.id)))
                    .length;
                if (potAmount > 0) {
                    this.state.sidePots.push({
                        amount: potAmount,
                        eligiblePlayers: this.state.players
                            .filter(p => p.totalBet >= bet && !this.state.foldedPlayers.has(p.id) && (this.state.playersInRound.has(p.id) || this.state.allInPlayers.has(p.id)))
                            .map(p => p.id)
                    });
                }
                previousBet = bet;
            }
        });
        this.state.pot = this.state.sidePots.reduce((sum, pot) => sum + pot.amount, 0);
        console.log(`Side pots created: ${JSON.stringify(this.state.sidePots)}`);
    },

    /**
     * Processes a fold action
     * @returns {boolean} Success status
     */
    fold() {
        if (this.state.currentTurn !== 'player') return false;
        this.state.playersInRound.delete('player');
        this.state.foldedPlayers.add('player');
        this.getPlayer('player').folds++;
        render.logAction('You folded.');
        this.state.currentTurn = this.getNextTurn();
        this.checkRound();
        return true;
    },

    /**
     * Processes a check or call action
     * @returns {boolean} Success status
     */
    checkOrCall() {
        if (this.state.currentTurn !== 'player' || this.state.allInPlayers.has('player')) return false;
        const toCall = this.state.currentBet - this.getPlayer('player').betThisRound;
        if (this.makeBet('player', toCall)) {
            this.state.currentTurn = this.getNextTurn();
            render.debouncedUpdateGameDisplay();
            this.checkRound();
            return true;
        }
        return false;
    },

    /**
     * Processes a raise action
     * @returns {boolean} Success status
     */
    raise() {
        if (this.state.currentTurn !== 'player' || this.state.allInPlayers.has('player')) return false;
        const raiseAmount = parseInt(render.DOM.raiseAmount.value) || 0;
        if (isNaN(raiseAmount) || raiseAmount < this.state.minRaise || raiseAmount <= this.state.currentBet) return false;
        if (this.makeBet('player', raiseAmount, true)) {
            render.logAction(`You raised to ${raiseAmount}.`);
            this.state.currentTurn = this.getNextTurn();
            render.debouncedUpdateGameDisplay();
            this.checkRound();
            return true;
        }
        return false;
    },

    /**
     * Gets the next turn starting from the dealer
     * @returns {string} Next player's ID or 'none'
     */
    getNextTurnFromDealer() {
        const dealerIndex = ALL_PLAYERS.indexOf(this.state.dealer);
        const startIndex = (dealerIndex + 1) % 4;
        for (let i = 0; i < 4; i++) {
            const nextIndex = (startIndex + i) % 4;
            const candidate = ALL_PLAYERS[nextIndex];
            if (
                this.state.playersInRound.has(candidate) &&
                !this.state.allInPlayers.has(candidate) &&
                !this.state.foldedPlayers.has(candidate) &&
                (!this.getPlayer(candidate).hasActed || this.state.currentBet > this.getPlayer(candidate).betThisRound)
            ) {
                return candidate;
            }
        }
        return 'none';
    },

    /**
     * Gets the next turn starting from the big blind
     * @param {string} bigBlindPlayer - Big blind player ID
     * @returns {string} Next player's ID or 'none'
     */
    getNextTurnFromBigBlind(bigBlindPlayer) {
        const bigBlindIndex = ALL_PLAYERS.indexOf(bigBlindPlayer);
        const startIndex = (bigBlindIndex + 1) % 4;
        for (let i = 0; i < 4; i++) {
            const nextIndex = (startIndex + i) % 4;
            const candidate = ALL_PLAYERS[nextIndex];
            if (
                this.state.playersInRound.has(candidate) &&
                !this.state.allInPlayers.has(candidate) &&
                !this.state.foldedPlayers.has(candidate) &&
                (!this.getPlayer(candidate).hasActed || this.state.currentBet > this.getPlayer(candidate).betThisRound)
            ) {
                return candidate;
            }
        }
        return 'none';
    },

    /**
     * Gets the next player's turn
     * @returns {string} Next player's ID or 'none'
     */
    getNextTurn() {
        if (![...this.state.playersInRound].every(p => this.state.allInPlayers.has(p) || this.state.foldedPlayers.has(p))) {
            const currentIndex = this.state.currentTurn === 'none' ? -1 : ALL_PLAYERS.indexOf(this.state.currentTurn);
            for (let i = 1; i <= 4; i++) {
                const nextIndex = (currentIndex + i) % 4;
                const candidate = ALL_PLAYERS[nextIndex];
                if (
                    this.state.playersInRound.has(candidate) &&
                    !this.state.allInPlayers.has(candidate) &&
                    !this.state.foldedPlayers.has(candidate) &&
                    (!this.getPlayer(candidate).hasActed || this.state.currentBet > this.getPlayer(candidate).betThisRound)
                ) {
                    return candidate;
                }
            }
        }
        return 'none';
    },

    /**
     * Checks if all bets are equal
     * @returns {boolean} Whether bets are equal
     */
    allBetsEqual() {
        return this.state.players.every(p =>
            p.betThisRound === this.state.currentBet ||
            this.state.allInPlayers.has(p.id) ||
            p.chips === 0 ||
            this.state.foldedPlayers.has(p.id)
        );
    },

    /**
     * Checks if the game is over
     * @returns {boolean} Whether the game is over
     */
    checkGameOver() {
        const activePlayers = this.state.players.filter(p => p.chips > 0 || (this.state.allInPlayers.has(p.id) && p.totalBet > 0));
        if (activePlayers.length <= 1) {
            const winner = activePlayers[0];
            if (winner) {
                render.logAction(`${this.getPlayerName(winner.id)} won with ${winner.chips} chips!`);
                this.state.isFirstGame = true;
                this.state.phase = 'preflop';
                this.state.currentTurn = 'none';
                render.debouncedUpdateGameDisplay();
            }
            return true;
        }
        return false;
    },

    /**
     * Checks and advances the round
     */
    checkRound() {
        if (this.state.playersInRound.size <= 1) {
            this.createSidePots();
            const winner = [...this.state.playersInRound][0];
            if (winner) {
                const winnerPlayer = this.getPlayer(winner);
                winnerPlayer.chips += this.state.pot;
                winnerPlayer.wins++;
                render.logAction(`${this.getPlayerName(winner)} won ${this.state.pot} chips as all others folded.`);
                this.state.pot = 0;
                this.state.currentBet = 0;
                this.state.minRaise = MIN_RAISE;
                this.state.phase = 'showdown';
                this.state.currentTurn = 'none';
                render.debouncedUpdateGameDisplay();
            }
            this.verifyChipTotal();
            return;
        }

        if (this.state.currentTurn === 'none' || (this.allBetsEqual() && [...this.state.playersInRound].every(p => this.getPlayer(p).hasActed || this.state.allInPlayers.has(p) || this.state.foldedPlayers.has(p)))) {
            this.state.players.forEach(p => {
                p.betThisRound = 0;
                p.hasActed = false;
            });
            this.state.currentBet = 0;
            this.state.minRaise = MIN_RAISE;

            if (this.state.phase === 'preflop') {
                this.state.phase = 'flop';
                this.ensureDeckSize(3);
                this.state.communityCards = this.state.deck.splice(0, 3);
                render.logAction('Flop dealt.');
                this.state.currentTurn = this.getNextTurnFromDealer();
            } else if (this.state.phase === 'flop') {
                this.state.phase = 'turn';
                this.ensureDeckSize(1);
                this.state.communityCards.push(this.state.deck.shift());
                render.logAction('Turn dealt.');
                this.state.currentTurn = this.getNextTurnFromDealer();
            } else if (this.state.phase === 'turn') {
                this.state.phase = 'river';
                this.ensureDeckSize(1);
                this.state.communityCards.push(this.state.deck.shift());
                render.logAction('River dealt.');
                this.state.currentTurn = this.getNextTurnFromDealer();
            } else if (this.state.phase === 'river') {
                this.state.phase = 'showdown';
                this.createSidePots();
                this.determineWinner();
                this.state.currentTurn = 'none';
                render.debouncedUpdateGameDisplay();
                this.verifyChipTotal();
                return;
            }
            render.debouncedUpdateGameDisplay();
        } else {
            this.state.currentTurn = this.getNextTurn();
            render.debouncedUpdateGameDisplay();
        }

        this.verifyChipTotal();

        if (this.state.currentTurn !== 'player' && this.state.currentTurn !== 'none') {
            setTimeout(() => ai.makeMove(this.state.currentTurn), 1000);
        }
    },

    /**
     * Determines the winner and distributes pots
     */
    determineWinner() {
        const eligiblePlayers = this.state.players.filter(p =>
            (this.state.playersInRound.has(p.id) || this.state.allInPlayers.has(p.id)) &&
            !this.state.foldedPlayers.has(p.id)
        );

        if (eligiblePlayers.length === 0) {
            render.logAction('No eligible players for showdown.');
            return;
        }

        const hands = eligiblePlayers.map(player => ({
            id: player.id,
            hand: this.evaluateHand([...player.cards, ...this.state.communityCards]),
            name: this.getPlayerName(player.id)
        }));

        hands.forEach(player => {
            if (this.state.phase === 'showdown' && !this.state.foldedPlayers.has(player.id)) {
                render.logAction(`${player.name} shows ${this.getHandDescription(player.hand)}.`);
            }
        });

        this.state.sidePots.forEach(pot => {
            const eligibleForPot = hands.filter(h => pot.eligiblePlayers.includes(h.id));
            if (eligibleForPot.length === 0) return;

            eligibleForPot.sort((a, b) => {
                if (a.hand.score !== b.hand.score) return b.hand.score - a.hand.score;
                if (a.hand.high !== b.hand.high) return b.hand.high - a.hand.high;
                for (let i = 0; i < Math.min(a.hand.tiebreakers.length, b.hand.tiebreakers.length); i++) {
                    if (a.hand.tiebreakers[i] !== b.hand.tiebreakers[i]) return b.hand.tiebreakers[i] - a.hand.tiebreakers[i];
                }
                return 0;
            });

            const highestScore = eligibleForPot[0].hand.score;
            const highestHigh = eligibleForPot[0].hand.high;
            const highestTiebreakers = eligibleForPot[0].hand.tiebreakers;
            const winners = eligibleForPot.filter(h =>
                h.hand.score === highestScore &&
                h.hand.high === highestHigh &&
                h.hand.tiebreakers.every((t, i) => t === highestTiebreakers[i])
            );

            const potShare = Math.floor(pot.amount / winners.length);
            let remainingChips = pot.amount % winners.length;
            winners.forEach(winner => {
                const player = this.getPlayer(winner.id);
                const share = potShare + (remainingChips > 0 ? 1 : 0);
                player.chips += share;
                player.wins++;
                render.logAction(`${winner.name} wins ${share} chips with ${this.getHandDescription(winner.hand)}.`);
                if (remainingChips > 0) remainingChips--;
            });
        });

        this.state.pot = 0;
        this.state.currentBet = 0;
        this.state.minRaise = MIN_RAISE;
        this.logChipCounts();
        this.verifyChipTotal();
        render.debouncedUpdateGameDisplay();
    },

    /**
     * Resets the round
     */
    resetRound() {
        this.state.deck = this.shuffle([...DECK]);
        this.state.communityCards = [];
        this.state.pot = 0;
        this.state.currentBet = 0;
        this.state.minRaise = MIN_RAISE;
        this.state.phase = 'preflop';
        this.state.playersInRound = new Set(ALL_PLAYERS.filter(p => this.getChips(p) > 0));
        this.state.foldedPlayers.clear();
        this.state.allInPlayers.clear();
        this.state.currentTurn = 'none';
        this.state.sidePots = [];
        this.state.players.forEach(p => {
            p.cards = [];
            p.betThisRound = 0;
            p.totalBet = 0;
            p.hasActed = false;
        });

        if (!this.state.isFirstGame) {
            const dealerIndex = ALL_PLAYERS.indexOf(this.state.dealer);
            this.state.dealer = ALL_PLAYERS[(dealerIndex + 1) % 4];
        }
        const dealerIndex = ALL_PLAYERS.indexOf(this.state.dealer);
        const smallBlindIndex = (dealerIndex + 1) % 4;
        const bigBlindIndex = (dealerIndex + 2) % 4;
        this.state.smallBlindPlayer = ALL_PLAYERS[smallBlindIndex];
        this.state.bigBlindPlayer = ALL_PLAYERS[bigBlindIndex];

        this.ensureDeckSize(8);
        this.state.playersInRound.forEach(p => {
            const player = this.getPlayer(p);
            player.cards = this.state.deck.splice(0, 2);
        });

        if (this.getChips(this.state.smallBlindPlayer) > 0) {
            this.makeBet(this.state.smallBlindPlayer, BLINDS.small, false, true);
        } else {
            this.state.playersInRound.delete(this.state.smallBlindPlayer);
            this.state.foldedPlayers.add(this.state.smallBlindPlayer);
            render.logAction(`${this.getPlayerName(this.state.smallBlindPlayer)} skipped small blind (no chips).`);
        }

        if (this.getChips(this.state.bigBlindPlayer) > 0) {
            this.makeBet(this.state.bigBlindPlayer, BLINDS.big, true, true);
            this.state.currentBet = BLINDS.big;
        } else {
            this.state.playersInRound.delete(this.state.bigBlindPlayer);
            this.state.foldedPlayers.add(this.state.bigBlindPlayer);
            render.logAction(`${this.getPlayerName(this.state.bigBlindPlayer)} skipped big blind (no chips).`);
        }

        if (this.checkGameOver()) return;

        this.state.currentTurn = ALL_PLAYERS[(bigBlindIndex + 1) % 4];
        if (!this.state.playersInRound.has(this.state.currentTurn) || this.state.foldedPlayers.has(this.state.currentTurn) || this.state.allInPlayers.has(this.state.currentTurn)) {
            this.state.currentTurn = this.getNextTurnFromBigBlind(this.state.bigBlindPlayer);
        }

        render.logAction('--- New Game Started ---');
        this.logChipCounts();
        this.state.isFirstGame = false;
        render.debouncedUpdateGameDisplay();

        if (this.state.currentTurn !== 'player' && this.state.currentTurn !== 'none') {
            setTimeout(() => ai.makeMove(this.state.currentTurn), 1000);
        }
    },

    /**
     * Resets the entire game
     */
    resetGame() {
        this.state = {
            ...this.state,
            deck: this.shuffle([...DECK]),
            communityCards: [],
            pot: 0,
            currentBet: 0,
            minRaise: MIN_RAISE,
            phase: 'preflop',
            playersInRound: new Set(ALL_PLAYERS),
            foldedPlayers: new Set(),
            allInPlayers: new Set(),
            currentTurn: 'none',
            dealer: 'player3',
            smallBlindPlayer: null,
            bigBlindPlayer: null,
            actionLog: [],
            isFirstGame: true,
            sidePots: [],
            players: ALL_PLAYERS.map(id => ({
                id,
                chips: 1000,
                cards: [],
                betThisRound: 0,
                totalBet: 0,
                wins: 0,
                folds: 0,
                hasActed: false
            }))
        };
        render.logAction('--- Game Reset ---');
        render.lastWinnerText = '';
        render.debouncedUpdateGameDisplay();
    }
};

/**
 * AI opponent decision-making
 */
const ai = {
    /**
     * Evaluates preflop hand strength based on starting cards
     * @param {Object[]} cards - Array of two card objects
     * @returns {number} Hand strength score (0 to 1)
     */
    evaluatePreflopHand(cards) {
        if (cards.length !== 2) return 0;
        const [card1, card2] = cards;
        const rank1 = gameLogic.rankValues.get(card1.rank);
        const rank2 = gameLogic.rankValues.get(card2.rank);
        const isSuited = card1.suit === card2.suit;
        const isPair = rank1 === rank2;
        const highRank = Math.max(rank1, rank2);
        const lowRank = Math.min(rank1, rank2);
        const gap = Math.abs(rank1 - rank2);

        let strength = highRank / 12 * 0.4;
        if (isPair) {
            strength = Math.max(strength, 0.5 + (highRank / 12) * 0.3);
        }
        if (isSuited) {
            strength += 0.1;
        }
        if (gap <= 4 && !isPair) {
            strength += 0.1 - gap * 0.02;
        }
        const positionIndex = ALL_PLAYERS.indexOf(gameLogic.state.currentTurn);
        const dealerIndex = ALL_PLAYERS.indexOf(gameLogic.state.dealer);
        const relativePosition = (positionIndex - dealerIndex + 4) % 4;
        const positionFactor = relativePosition / 3 * 0.1;
        return Math.min(1, strength + positionFactor);
    },

    /**
     * Evaluates post-flop hand strength
     * @param {Object} hand - Evaluated hand object
     * @returns {number} Hand strength score (0 to 1)
     */
    evaluateHandStrength(hand) {
        return (hand.score / 8) * 0.7 + (hand.high / 12) * 0.2 + (hand.tiebreakers.reduce((sum, t) => sum + t, 0) / (12 * hand.tiebreakers.length)) * 0.1;
    },

    /**
     * Makes an AI move for a player
     * @param {string} id - Player ID
     */
    makeMove(id) {
        if (gameLogic.state.currentTurn !== id || gameLogic.state.phase === 'showdown' || gameLogic.state.allInPlayers.has(id)) return;
        const player = gameLogic.getPlayer(id);
        if (!player) return;

        const cards = gameLogic.state.phase === 'preflop' ? player.cards : [...player.cards, ...gameLogic.state.communityCards];
        const handStrength = gameLogic.state.phase === 'preflop' ? this.evaluatePreflopHand(cards) : this.evaluateHandStrength(gameLogic.evaluateHand(cards));
        const toCall = gameLogic.state.currentBet - player.betThisRound;
        const potOdds = toCall > 0 ? toCall / (gameLogic.state.pot + toCall) : 0;

        console.log(`AI move for ${gameLogic.getPlayerName(id)}: handStrength=${handStrength.toFixed(2)}, potOdds=${potOdds.toFixed(2)}, toCall=${toCall}`);

        const minRaise = Math.max(gameLogic.state.minRaise, gameLogic.state.currentBet + BLINDS.big);
        const maxRaise = player.chips + player.betThisRound;

        if (handStrength >= 0.7 && player.chips >= minRaise && Math.random() < 0.5) {
            const raiseAmount = Math.min(maxRaise, Math.max(minRaise, Math.floor((gameLogic.state.pot * 0.75) / 25) * 25));
            if (gameLogic.makeBet(id, raiseAmount, true)) {
                render.logAction(`${gameLogic.getPlayerName(id)} raised to ${raiseAmount}.`);
                gameLogic.state.currentTurn = gameLogic.getNextTurn();
                render.debouncedUpdateGameDisplay();
                gameLogic.checkRound();
            }
        } else if (toCall === 0 && handStrength >= 0.3) {
            render.logAction(`${gameLogic.getPlayerName(id)} checked.`);
            gameLogic.getPlayer(id).hasActed = true;
            gameLogic.state.currentTurn = gameLogic.getNextTurn();
            render.debouncedUpdateGameDisplay();
            gameLogic.checkRound();
        } else if (toCall > 0 && handStrength > potOdds && player.chips >= toCall) {
            if (gameLogic.makeBet(id, toCall)) {
                gameLogic.state.currentTurn = gameLogic.getNextTurn();
                render.debouncedUpdateGameDisplay();
                gameLogic.checkRound();
            }
        } else {
            gameLogic.state.playersInRound.delete(id);
            gameLogic.state.foldedPlayers.add(id);
            player.folds++;
            render.logAction(`${gameLogic.getPlayerName(id)} folded.`);
            gameLogic.state.currentTurn = gameLogic.getNextTurn();
            gameLogic.checkRound();
        }
    }
};

/**
 * Event listeners and initialization
 */
function init() {
    render.initDOM();

    render.DOM.startButton.addEventListener('click', () => gameLogic.resetRound());
    render.DOM.continueButton.addEventListener('click', () => gameLogic.resetRound());
    render.DOM.foldButton.addEventListener('click', () => gameLogic.fold());
    render.DOM.checkCallButton.addEventListener('click', () => gameLogic.checkOrCall());
    render.DOM.raiseButton.addEventListener('click', () => gameLogic.raise());
    render.DOM.raiseAmount.addEventListener('input', () => render.validateRaiseAmount());
    render.DOM.resetGameButton.addEventListener('click', () => gameLogic.resetGame());

    render.DOM.logToggle.addEventListener('click', () => {
        render.DOM.actionLog.classList.toggle('hidden');
        render.DOM.logToggle.textContent = render.DOM.actionLog.classList.contains('hidden') ? 'Show Log' : 'Hide Log';
    });

    document.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 's') render.DOM.startButton.click();
        if (e.key.toLowerCase() === 'c') render.DOM.continueButton.click();
        if (e.key.toLowerCase() === 'f') render.DOM.foldButton.click();
        if (e.key.toLowerCase() === 'k') render.DOM.checkCallButton.click();
        if (e.key.toLowerCase() === 'r') render.DOM.raiseButton.click();
        if (e.key.toLowerCase() === 'q') render.DOM.resetGameButton.click();
    });

    render.updateGameDisplay();
}

window.addEventListener('load', init);