let player = {
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

let countdownInterval = null;
let energyCountdownInterval = null;

const crimes = [
    { name: "Pickpocketing", cash: [1, 5], xp: 5, influence: 2, energy: 10, baseSuccess: 5, successIncrement: 2, tooltip: "Grab some dough from unsuspecting marks." },
    { name: "Bootleg Run", cash: [10, 20], xp: 10, influence: 5, energy: 15, baseSuccess: 5, successIncrement: 1, tooltip: "Smuggle hooch past the coppers." },
    { name: "Speakeasy Heist", cash: [500, 2000], xp: 100, influence: 50, gold: [2, 5], baseSuccess: 5, successIncrement: 0.5, maxPerDay: 3, tooltip: "Knock over a rival juice joint for big dough." }
];

const market = [
    { name: "Crowbar", price: 10, effect: { crime: "Pickpocketing", success: 5 }, tooltip: "Boosts Pickpocketing by 5% (1 max)." },
    { name: "Revolver", price: 50, effect: { crime: "Speakeasy Heist", success: 10 }, tooltip: "Boosts Speakeasy Heist by 10% (1 max)." },
    { name: "Bribe", price: 100, effect: { success: 10 }, tooltip: "Boosts all crime success by 10% (1 max)." },
    { name: "Gold", price: 10000, tooltip: "Trade $10,000 for a shiny gold coin." }
];

function savePlayer() {
    console.log("Saving player:", JSON.stringify(player));
    localStorage.setItem("prohibitionPlayer", JSON.stringify(player));
}

function loadPlayer() {
    console.log("Loading player...");
    try {
        const saved = localStorage.getItem("prohibitionPlayer");
        if (saved) {
            player = JSON.parse(saved);
            console.log("Loaded player:", JSON.stringify(player));
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
        updateEnergy();
        savePlayer();
    } catch (e) {
        console.error("Error loading player data:", e);
        player.crimeResults = {};
        player.successCount = { "Pickpocketing": 0, "Bootleg Run": 0, "Speakeasy Heist": 0 };
        player.lastEnergyTick = Date.now();
    }
}

function updateEnergy() {
    console.log("Updating energy...");
    const now = Date.now();
    const minutesPassed = Math.floor((now - player.lastEnergyTick) / 60000);
    if (minutesPassed >= 1) {
        player.energy = Math.min(10000, player.energy + (minutesPassed * 5));
        player.lastEnergyTick += minutesPassed * 60000;
        player.lastEnergyUpdate = now;
        console.log(`Energy updated: ${player.energy}, last tick: ${player.lastEnergyTick}`);
    }
    savePlayer();
}

function formatCountdown(ms) {
    if (ms <= 0) return "0h 0m 0s";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
}

function formatEnergyCountdown() {
    const now = Date.now();
    const msSinceLastTick = now - player.lastEnergyTick;
    const msUntilNextMinute = 60000 - (msSinceLastTick % 60000);
    if (msUntilNextMinute <= 0) return "00:00";
    const minutes = Math.floor(msUntilNextMinute / 60000);
    const seconds = Math.floor((msUntilNextMinute % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateUI() {
    console.log("Updating UI...");
    try {
        updateEnergy();
        const stats = `Player: ${player.name} | Rank: ${player.rank} | Cash: $${player.cash} | XP: ${player.xp} | Influence: ${player.influence} | Energy: ${player.energy} | Gold: ${player.gold} | Health: ${player.health}`;
        document.getElementById("player-stats").textContent = stats;
        document.getElementById("profile-stats").textContent = stats;
        
        const crimesTab = document.getElementById("crimes");
        if (crimesTab.classList.contains("active")) {
            const energyText = player.energy < 10000 ? `${player.energy} (+5 in ${formatEnergyCountdown()})` : `${player.energy}`;
            document.getElementById("energy-text").textContent = energyText;
            document.getElementById("energy-fill").style.width = `${(player.energy / 10000) * 100}%`;
            document.getElementById("energy-fill").querySelector(".progress-text").textContent = `${player.energy}/10000`;

            // Clear existing energy countdown interval
            if (energyCountdownInterval) {
                clearInterval(energyCountdownInterval);
                energyCountdownInterval = null;
            }

            // Start energy countdown if energy < 10000
            if (player.energy < 10000) {
                energyCountdownInterval = setInterval(() => {
                    if (!document.getElementById("crimes").classList.contains("active")) {
                        clearInterval(energyCountdownInterval);
                        energyCountdownInterval = null;
                        return;
                    }
                    const now = Date.now();
                    const msSinceLastTick = now - player.lastEnergyTick;
                    if (msSinceLastTick >= 60000) {
                        player.energy = Math.min(10000, player.energy + 5);
                        player.lastEnergyTick += 60000;
                        player.lastEnergyUpdate = now;
                        savePlayer();
                        if (player.energy >= 10000) {
                            clearInterval(energyCountdownInterval);
                            energyCountdownInterval = null;
                            document.getElementById("energy-text").textContent = `${player.energy}`;
                            document.getElementById("energy-fill").style.width = `${(player.energy / 10000) * 100}%`;
                            document.getElementById("energy-fill").querySelector(".progress-text").textContent = `${player.energy}/10000`;
                            return;
                        }
                    }
                    document.getElementById("energy-text").textContent = `${player.energy} (+5 in ${formatEnergyCountdown()})`;
                    document.getElementById("energy-fill").style.width = `${(player.energy / 10000) * 100}%`;
                    document.getElementById("energy-fill").querySelector(".progress-text").textContent = `${player.energy}/10000`;
                }, 1000);
            }

            console.log("Generating crime list...");
            let crimeList = "";
            const now = Date.now();
            let bribeActive = player.items.includes("Bribe");

            // Clear existing heist countdown interval
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }

            for (let crime of crimes) {
                console.log(`Processing crime: ${crime.name}, Energy: ${player.energy}, XP: ${player.xp}, Successes: ${player.successCount[crime.name]}`);
                let canAttempt = true;
                let status = crime.tooltip;
                let successChance = crime.baseSuccess + (player.successCount[crime.name] * crime.successIncrement);
                let itemBonus = 0;
                if (bribeActive) itemBonus += 10;
                if (crime.name === "Pickpocketing" && player.items.includes("Crowbar")) itemBonus += 5;
                if (crime.name === "Speakeasy Heist" && player.items.includes("Revolver")) itemBonus += 10;
                successChance = Math.min(100, successChance + itemBonus);
                if (crime.name === "Speakeasy Heist" && player.xp < 500) {
                    canAttempt = false;
                    status = "Need Capo rank (500 XP)";
                } else if (crime.energy && player.energy < crime.energy) {
                    canAttempt = false;
                    status = `Need ${crime.energy} Energy`;
                } else if (crime.maxPerDay) {
                    const attempts = player.crimeAttempts[crime.name].timestamps.filter(t => now - t < 86400000);
                    console.log(`${crime.name} attempts:`, attempts);
                    if (attempts.length >= crime.maxPerDay) {
                        canAttempt = false;
                        const earliest = Math.min(...player.crimeAttempts[crime.name].timestamps);
                        const remainingMs = 86400000 - (now - earliest);
                        status = `Next attempt in ${formatCountdown(remainingMs)}`;
                        // Start heist countdown interval
                        if (!countdownInterval) {
                            countdownInterval = setInterval(() => {
                                if (!document.getElementById("crimes").classList.contains("active")) {
                                    clearInterval(countdownInterval);
                                    countdownInterval = null;
                                    return;
                                }
                                const newNow = Date.now();
                                const newRemainingMs = 86400000 - (newNow - earliest);
                                if (newRemainingMs <= 0) {
                                    player.crimeAttempts[crime.name].timestamps = player.crimeAttempts[crime.name].timestamps.filter(t => newNow - t < 86400000);
                                    clearInterval(countdownInterval);
                                    countdownInterval = null;
                                    updateUI();
                                    return;
                                }
                                document.querySelector(`#crime-list .bordered:nth-child(${crimes.indexOf(crime) + 1}) p:nth-child(2)`).textContent = `Status: Next attempt in ${formatCountdown(newRemainingMs)}`;
                            }, 1000);
                        }
                    }
                }
                const resultMessage = player.crimeResults[crime.name] || "";
                crimeList += `
                    <div class="bordered">
                        <p>${crime.name}: $${crime.cash[0]}-$${crime.cash[1]}, ${crime.xp} XP, ${crime.influence} Influence${crime.gold ? `, ${crime.gold[0]}-${crime.gold[1]} Gold` : ""}, ${crime.energy ? crime.energy + " Energy" : crime.maxPerDay + "/day"} (Success: ${successChance.toFixed(1)}%)</p>
                        <p>Status: ${status}</p>
                        <div class="crime-action">
                            <button ${canAttempt ? "" : "disabled"} onclick="commitCrime('${crime.name}')">Attempt</button>
                            ${resultMessage ? `<p>${resultMessage}</p>` : ""}
                        </div>
                        <div class="progress-bar"><div class="success-fill" style="width: ${successChance}%"><span class="success-text">${successChance.toFixed(1)}%</span></div></div>
                    </div>`;
                if (resultMessage) {
                    console.log(`Rendered crime result for ${crime.name}: ${resultMessage}`);
                }
            }
            console.log("Crime list HTML:", crimeList);
            document.getElementById("crime-list").innerHTML = crimeList || "<p>No crimes available. Check console.</p>";
        } else {
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            if (energyCountdownInterval) {
                clearInterval(energyCountdownInterval);
                energyCountdownInterval = null;
            }
        }

        const speakeasyTab = document.getElementById("speakeasy");
        if (speakeasyTab.classList.contains("active")) {
            document.getElementById("bet-amount").value = 10;
            document.getElementById("gold-bet-amount").value = 1;
            if (!speakeasyTab.dataset.resultSet || speakeasyTab.dataset.resultSet === "false") {
                document.getElementById("gamble-result").textContent = "Double your bet or lose it.";
                speakeasyTab.dataset.resultSet = "false";
            }
        }

        const inventoryTab = document.getElementById("inventory");
        if (inventoryTab.classList.contains("active")) {
            let inventoryList = "<p>Owned Items:</p>";
            if (player.items.length === 0) {
                inventoryList += "<p>None</p>";
            } else {
                for (let itemName of player.items) {
                    const item = market.find(i => i.name === itemName);
                    if (item) {
                        inventoryList += `<p>${item.name}: Active - ${item.tooltip}</p>`;
                    }
                }
            }
            inventoryList += `<p>Cash: $${player.cash} | Gold: ${player.gold}</p>`;
            document.getElementById("inventory-list").innerHTML = inventoryList;

            let marketList = "";
            for (let item of market) {
                const owned = player.items.includes(item.name) && item.name !== "Gold";
                marketList += `
                    <div class="bordered">
                        <p>${item.name}: $${item.price} - ${item.tooltip}</p>
                        <button ${owned || player.cash < item.price ? "disabled" : ""} onclick="buyItem('${item.name}')">Buy</button>
                    </div>`;
            }
            document.getElementById("market-list").innerHTML = marketList;
        }

        document.getElementById("health-fill").style.width = `${player.health}%`;
        document.getElementById("health-fill").querySelector(".progress-text").textContent = `${player.health}/100`;
        document.getElementById("health-fill-profile").style.width = `${player.health}%`;
        document.getElementById("health-fill-profile").querySelector(".progress-text").textContent = `${player.health}/100`;
    } catch (e) {
        console.error("UI update error:", e);
        document.getElementById("crime-list").innerHTML = "<p>Error loading crimes. Check console.</p>";
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        if (energyCountdownInterval) {
            clearInterval(energyCountdownInterval);
            energyCountdownInterval = null;
        }
    }
}

function commitCrime(crimeName) {
    console.log(`Attempting crime: ${crimeName}`);
    try {
        const crime = crimes.find(c => c.name === crimeName);
        if (!crime) {
            console.log("Crime not found:", crimeName);
            return;
        }
        const now = Date.now();
        if (crime.energy && player.energy < crime.energy) {
            console.log("Not enough Energy for", crimeName);
            return;
        }
        if (crime.maxPerDay) {
            const attempts = player.crimeAttempts[crime.name].timestamps.filter(t => now - t < 86400000);
            if (attempts.length >= crime.maxPerDay) {
                console.log("Max attempts reached for", crimeName);
                return;
            }
            player.crimeAttempts[crime.name].timestamps.push(now);
        }
        if (crime.energy) player.energy -= crime.energy;

        let successChance = crime.baseSuccess + (player.successCount[crime.name] * crime.successIncrement);
        let itemBonus = 0;
        if (player.items.includes("Bribe")) itemBonus += 10;
        if (crime.name === "Pickpocketing" && player.items.includes("Crowbar")) itemBonus += 5;
        if (crime.name === "Speakeasy Heist" && player.items.includes("Revolver")) itemBonus += 10;
        successChance = Math.min(100, successChance + itemBonus);
        const risk = 1 - (successChance / 100);
        console.log(`Crime: ${crimeName}, Success: ${successChance.toFixed(1)}%, Risk: ${(risk * 100).toFixed(1)}%, Successes: ${player.successCount[crime.name]}`);

        const success = Math.random() > risk;
        let message = "";
        if (success) {
            player.successCount[crime.name]++;
            const cash = Math.floor(Math.random() * (crime.cash[1] - crime.cash[0] + 1)) + crime.cash[0];
            player.cash += cash;
            player.xp += crime.xp;
            player.influence += crime.influence;
            if (crime.gold) {
                const gold = Math.floor(Math.random() * (crime.gold[1] - crime.gold[0] + 1)) + crime.gold[0];
                player.gold += gold;
                message = `Success: Snagged $${cash}, ${crime.xp} XP, ${crop.influence} Influence, ${gold} Gold.`;
            } else {
                message = `Success: Snagged $${cash}, ${crime.xp} XP, ${crime.influence} Influence.`;
            }
        } else {
            message = "Failed: Try again!";
        }
        console.log(`Crime result for ${crimeName}: ${message}`);
        player.crimeResults[crimeName] = message;
        updateRank();
        savePlayer();
        updateUI();
    } catch (e) {
        console.error(`Error in commitCrime for ${crimeName}:`, e);
        player.crimeResults[crimeName] = "Error: Try again!";
        updateUI();
    }
}

function buyItem(itemName) {
    console.log(`Buying item: ${itemName}`);
    try {
        const item = market.find(i => i.name === itemName);
        if (!item || player.cash < item.price || (item.name !== "Gold" && player.items.includes(item.name))) {
            console.log("Cannot buy:", !item ? "Item not found" : player.cash < item.price ? "Not enough cash" : "Item already owned");
            return;
        }
        player.cash -= item.price;
        if (itemName === "Gold") player.gold++;
        else player.items.push(itemName);
        savePlayer();
        updateUI();
    } catch (e) {
        console.error("Error in buyItem:", e);
    }
}

function gamble() {
    console.log("Gambling cash...");
    try {
        const bet = parseInt(document.getElementById("bet-amount").value);
        if (bet < 10 || bet > 100 || player.cash < bet) {
            console.log("Invalid bet:", bet);
            document.getElementById("gamble-result").textContent = "Invalid bet: $10-$100 or insufficient cash.";
            document.getElementById("speakeasy").dataset.resultSet = "true";
            return;
        }
        player.cash -= bet;
        const win = Math.random() < 0.5;
        const result = win ? `Won $${bet * 2}!` : `Lost $${bet}.`;
        console.log(`Cash bet: ${bet}, Outcome: ${result}, New cash: ${player.cash}`);
        if (win) player.cash += bet * 2;
        document.getElementById("gamble-result").textContent = result;
        document.getElementById("speakeasy").dataset.resultSet = "true";
        savePlayer();
        updateUI();
    } catch (e) {
        console.error("Error in gamble:", e);
        document.getElementById("gamble-result").textContent = "Error: Try again!";
        document.getElementById("speakeasy").dataset.resultSet = "true";
    }
}

function gambleGold() {
    console.log("Gambling gold...");
    try {
        const bet = parseInt(document.getElementById("gold-bet-amount").value);
        if (bet < 1 || bet > 100 || player.gold < bet) {
            console.log("Invalid gold bet:", bet);
            document.getElementById("gamble-result").textContent = "Invalid bet: 1-100 Gold or insufficient Gold.";
            document.getElementById("speakeasy").dataset.resultSet = "true";
            return;
        }
        player.gold -= bet;
        const win = Math.random() < 0.5;
        const result = win ? `Won ${bet * 2} Gold!` : `Lost ${bet} Gold.`;
        console.log(`Gold bet: ${bet}, Outcome: ${result}, New gold: ${player.gold}`);
        if (win) player.gold += bet * 2;
        document.getElementById("gamble-result").textContent = result;
        document.getElementById("speakeasy").dataset.resultSet = "true";
        savePlayer();
        updateUI();
    } catch (e) {
        console.error("Error in gambleGold:", e);
        document.getElementById("gamble-result").textContent = "Error: Try again!";
        document.getElementById("speakeasy").dataset.resultSet = "true";
    }
}

function updateRank() {
    try {
        if (player.xp >= 2000) player.rank = "Boss";
        else if (player.xp >= 500) player.rank = "Capo";
        else if (player.xp >= 100) player.rank = "Enforcer";
        else player.rank = "Thug";
    } catch (e) {
        console.error("Error in updateRank:", e);
    }
}

function showTab(tabId) {
    console.log(`Showing tab: ${tabId}`);
    try {
        document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
        document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
        document.getElementById(tabId).classList.add("active");
        document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add("active");
        setTimeout(() => {
            player.crimeResults = {};
            updateUI();
        }, 500);
    } catch (e) {
        console.error("Error in showTab:", e);
    }
}

function logout() {
    console.log("Logging out...");
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
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        if (energyCountdownInterval) {
            clearInterval(energyCountdownInterval);
            energyCountdownInterval = null;
        }
        updateUI();
    } catch (e) {
        console.error("Error in logout:", e);
    }
}

window.onload = function() {
    console.log("Window loaded, initializing game...");
    try {
        loadPlayer();
        updateUI();
    } catch (e) {
        console.error("Error in window.onload:", e);
        document.getElementById("crime-list").innerHTML = "<p>Error initializing game. Check console.</p>";
    }
};