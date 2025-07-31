export let player = {
    name: "Player",
    rank: "Thug",
    cash: 0,
    xp: 0,
    influence: 0,
    energy: 50000,
    gold: 0,
    health: 100,
    items: [],
    successCount: {},
    crimeAttempts: {},
    crimeResults: {},
    lastEnergyTick: Date.now(),
    lastEnergyUpdate: Date.now()
};

export function savePlayer() {
    try {
        localStorage.setItem("player", JSON.stringify(player));
    } catch (e) {
        console.error("Error saving player:", e);
    }
}

export function loadPlayer() {
    try {
        const saved = localStorage.getItem("player");
        if (saved) {
            const loaded = JSON.parse(saved);
            player.name = loaded.name || "Player";
            player.rank = loaded.rank || "Thug";
            player.cash = loaded.cash || 0;
            player.xp = loaded.xp || 0;
            player.influence = loaded.influence || 0;
            player.energy = loaded.energy !== undefined ? loaded.energy : 50000;
            player.gold = loaded.gold || 0;
            player.health = loaded.health !== undefined ? loaded.health : 100;
            player.items = loaded.items || [];
            player.successCount = loaded.successCount || {};
            player.crimeAttempts = loaded.crimeAttempts || {};
            player.crimeResults = loaded.crimeResults || {};
            player.lastEnergyTick = loaded.lastEnergyTick || Date.now();
            player.lastEnergyUpdate = loaded.lastEnergyUpdate || Date.now();
        } else {
            player.lastEnergyTick = Date.now();
            player.lastEnergyUpdate = Date.now();
            savePlayer();
        }
    } catch (e) {
        console.error("Error loading player:", e);
        player.lastEnergyTick = Date.now();
        player.lastEnergyUpdate = Date.now();
        savePlayer();
    }
}

export function updateRank() {
    const ranks = [
        { name: "Thug", xp: 0 },
        { name: "Runner", xp: 100 },
        { name: "Soldier", xp: 250 },
        { name: "Enforcer", xp: 500 },
        { name: "Lieutenant", xp: 1000 },
        { name: "Capo", xp: 2500 },
        { name: "Underboss", xp: 5000 },
        { name: "Boss", xp: 10000 }
    ];
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (player.xp >= ranks[i].xp) {
            player.rank = ranks[i].name;
            break;
        }
    }
    savePlayer();
}

loadPlayer();