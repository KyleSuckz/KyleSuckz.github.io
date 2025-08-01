export let player = {
    name: "Player",
    rank: "Thug",
    cash: 0,
    xp: 0,
    influence: 0,
    energy: 10000,
    gold: 0,
    items: [],
    health: 100,
    lastEnergyUpdate: Date.now(),
    lastEnergyTick: Date.now(),
    crimeAttempts: { "Speakeasy Heist": { timestamps: [] } },
    crimeResults: {},
    successCount: { "Pickpocketing": 0, "Bootleg Run": 0, "Speakeasy Heist": 0 }
};

export function savePlayer() {
    localStorage.setItem("prohibitionPlayer", JSON.stringify(player));
}

export function loadPlayer() {
    try {
        const saved = localStorage.getItem("prohibitionPlayer");
        if (saved) {
            player = JSON.parse(saved);
            if (!player.crimeResults) player.crimeResults = {};
            if (!player.successCount) player.successCount = { "Pickpocketing": 0, "Bootleg Run": 0, "Speakeasy Heist": 0 };
            if (!player.lastEnergyTick) player.lastEnergyTick = Date.now();
            const uniqueItems = [];
            for (let item of player.items) {
                if (item === "Gold" || !uniqueItems.includes(item)) {
                    uniqueItems.push(item);
                }
            }
            player.items = uniqueItems;
            player.crimeAttempts = { "Speakeasy Heist": player.crimeAttempts["Speakeasy Heist"] || { timestamps: [] } };
        }
        savePlayer();
    } catch (e) {
        console.error("Error loading player data:", e);
        player.crimeResults = {};
        player.successCount = { "Pickpocketing": 0, "Bootleg Run": 0, "Speakeasy Heist": 0 };
        player.lastEnergyTick = Date.now();
    }
}

export function updateRank() {
    try {
        if (player.xp >= 10000) player.rank = "Boss";
        else if (player.xp >= 5000) player.rank = "Underboss";
        else if (player.xp >= 2500) player.rank = "Capo";
        else if (player.xp >= 1000) player.rank = "Lieutenant";
        else if (player.xp >= 500) player.rank = "Enforcer";
        else if (player.xp >= 250) player.rank = "Soldier";
        else if (player.xp >= 100) player.rank = "Runner";
        else player.rank = "Thug";
    } catch (e) {
        console.error("Error in updateRank:", e);
    }
}

export function logout() {
    try {
        localStorage.removeItem("prohibitionPlayer");
        player = {
            name: "Player",
            rank: "Thug",
            cash: 0,
            xp: 0,
            influence: 0,
            energy: 10000,
            gold: 0,
            items: [],
            health: 100,
            lastEnergyUpdate: Date.now(),
            lastEnergyTick: Date.now(),
            crimeAttempts: { "Speakeasy Heist": { timestamps: [] } },
            crimeResults: {},
            successCount: { "Pickpocketing": 0, "Bootleg Run": 0, "Speakeasy Heist": 0 }
        };
        savePlayer();
    } catch (e) {
        console.error("Error in logout:", e);
    }
}