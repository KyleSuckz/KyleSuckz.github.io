import { loadPlayer, savePlayer, player } from './player.js';
import { updateUI, showTab } from './ui.js';

function initialize() {
    try {
        loadPlayer();
        updateUI();
        showTab('crimes');
    } catch (e) {
        console.error("Initialization error:", e);
    }
}

export function logout() {
    try {
        player.name = "Player";
        player.rank = "Thug";
        player.cash = 0;
        player.xp = 0;
        player.influence = 0;
        player.energy = 50000;
        player.gold = 0;
        player.health = 100;
        player.items = [];
        player.successCount = {
            Pickpocketing: 0,
            Bootlegging: 0,
            "Speakeasy Heist": 0
        };
        player.crimeAttempts = {
            Pickpocketing: { timestamps: [] },
            Bootlegging: { timestamps: [] },
            "Speakeasy Heist": { timestamps: [] }
        };
        player.crimeResults = {};
        player.lastEnergyTick = Date.now();
        player.lastEnergyUpdate = Date.now();
        savePlayer();
        showTab('crimes');
        updateUI();
    } catch (e) {
        console.error("Logout error:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
});

initialize();