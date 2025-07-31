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
    successCount: {
        Pickpocketing: 0,
        Bootlegging: 0,
        "Speakeasy Heist": 0
    },
    crimeAttempts: {
        Pickpocketing: { timestamps: [] },
        Bootlegging: { timestamps: [] },
        "Speakeasy Heist": { timestamps: [] }
    },
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
            player = JSON.parse(saved);
            player.successCount = player.successCount || {
                Pickpocketing: 0,
                Bootlegging: 0,
                "Speakeasy Heist": 0
            };
            player.crimeAttempts = player.crimeAttempts || {
                Pickpocketing: { timestamps: [] },
                Bootlegging: { timestamps: [] },
                "Speakeasy Heist": { timestamps: [] }
            };
            player.crimeResults = player.crimeResults || {};
            updateRank();
        }
    } catch (e) {
        console.error("Error loading player:", e);
    }
}

export function updateRank() {
    try {
        if (player.xp >= 10000) {
            player.rank = "Boss";
        } else if (player.xp >= 5000) {
            player.rank = "Underboss";
        } else if (player.xp >= 2500) {
            player.rank = "Capo";
        } else if (player.xp >= 1000) {
            player.rank = "Lieutenant";
        } else if (player.xp >= 500) {
            player.rank = "Enforcer";
        } else if (player.xp >= 250) {
            player.rank = "Soldier";
        } else if (player.xp >= 100) {
            player.rank = "Runner";
        } else {
            player.rank = "Thug";
        }
    } catch (e) {
        console.error("Error updating rank:", e);
    }
}