let player = {
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

const crimes = [
    {
        name: "Pickpocketing",
        cash: [10, 50],
        xp: 10,
        influence: 5,
        energy: 10,
        baseSuccess: 90,
        successIncrement: 0.5,
        tooltip: "Grab some dough from unsuspecting marks."
    },
    {
        name: "Bootlegging",
        cash: [100, 500],
        xp: 50,
        influence: 25,
        maxPerDay: 3,
        baseSuccess: 70,
        successIncrement: 1,
        gold: [0, 1],
        tooltip: "Smuggle hooch past the coppers."
    },
    {
        name: "Speakeasy Heist",
        cash: [1000, 5000],
        xp: 250,
        influence: 100,
        energy: 100,
        baseSuccess: 50,
        successIncrement: 2,
        gold: [1, 5],
        tooltip: "Knock over a rival's gin joint."
    }
];

const market = [
    { name: "Bribe", price: 1000, tooltip: "+10% success chance to all crimes." },
    { name: "Crowbar", price: 500, tooltip: "+5% success chance to Pickpocketing." },
    { name: "Revolver", price: 2000, tooltip: "+10% success chance to Speakeasy Heist." }
];

function savePlayer() {
    try {
        localStorage.setItem("player", JSON.stringify(player));
    } catch (e) {
        console.error("Error saving player:", e);
    }
}

function loadPlayer() {
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

function updateRank() {
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

function formatCountdown(ms) {
    try {
        const seconds = Math.floor(ms / 1000);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } catch (e) {
        console.error("Error formatting countdown:", e);
        return "00:00:00";
    }
}

function formatEnergyCountdown() {
    try {
        const now = Date.now();
        const msSinceLastTick = now - player.lastEnergyTick;
        const msUntilNextTick = 60000 - (msSinceLastTick % 60000);
        return formatCountdown(msUntilNextTick);
    } catch (e) {
        console.error("Error formatting energy countdown:", e);
        return "00:00:00";
    }
}

function updateEnergy() {
    try {
        const now = Date.now();
        const msSinceLastUpdate = now - player.lastEnergyUpdate;
        if (msSinceLastUpdate >= 60000) {
            const ticks = Math.floor(msSinceLastUpdate / 60000);
            player.energy = Math.min(50000, player.energy + (ticks * 5));
            player.lastEnergyTick += ticks * 60000;
            player.lastEnergyUpdate = now;
            savePlayer();
        }
    } catch (e) {
        console.error("Error updating energy:", e);
    }
}

function updateUI() {
    try {
        updateEnergy();
        const stats = `Player: ${player.name} | Rank: ${player.rank} | Cash: $${player.cash} | XP: ${player.xp} | Influence: ${player.influence} | Energy: ${player.energy} | Gold: ${player.gold} | Health: ${player.health}`;
        document.getElementById("player-stats").textContent = stats;
        document.getElementById("profile-stats").textContent = stats;
        
        let rankThreshold = 100;
        let nextRank = "Runner";
        if (player.xp >= 10000) {
            rankThreshold = 10000;
            nextRank = "Boss";
        } else if (player.xp >= 5000) {
            rankThreshold = 10000;
            nextRank = "Boss";
        } else if (player.xp >= 2500) {
            rankThreshold = 5000;
            nextRank = "Underboss";
        } else if (player.xp >= 1000) {
            rankThreshold = 2500;
            nextRank = "Capo";
        } else if (player.xp >= 500) {
            rankThreshold = 1000;
            nextRank = "Lieutenant";
        } else if (player.xp >= 250) {
            rankThreshold = 500;
            nextRank = "Enforcer";
        } else if (player.xp >= 100) {
            rankThreshold = 250;
            nextRank = "Soldier";
        }
        const rankProgress = Math.min(100, (player.xp / rankThreshold) * 100);
        const rankText = player.rank === "Boss" ? `${player.xp}/${rankThreshold} (100%)` : `${player.xp}/${rankThreshold} (${rankProgress.toFixed(0)}%) to ${nextRank}`;
        const rankFill = document.getElementById("rank-fill");
        const rankTextElement = rankFill?.querySelector(".progress-text");
        let rankTextWidth = 0;
        if (rankFill && rankTextElement) {
            rankFill.style.width = `${rankProgress}%`;
            rankTextElement.textContent = rankText;
            rankTextWidth = rankTextElement.offsetWidth / rankFill.parentElement.offsetWidth * 100;
            rankTextElement.style.left = `${rankProgress / 2 - rankTextWidth / 2}%`;
        }
        const rankFillProfile = document.getElementById("rank-fill-profile");
        const rankTextElementProfile = rankFillProfile?.querySelector(".progress-text");
        if (rankFillProfile && rankTextElementProfile) {
            rankFillProfile.style.width = `${rankProgress}%`;
            rankTextElementProfile.textContent = rankText;
            rankTextElementProfile.style.left = `${rankProgress / 2 - rankTextWidth / 2}%`;
        }

        const crimesTab = document.getElementById("crimes");
        if (crimesTab.classList.contains("active")) {
            const energyText = player.energy < 50000 ? `${player.energy} (+5 in ${formatEnergyCountdown()})` : `${player.energy}`;
            document.getElementById("energy-text").textContent = `Energy: ${energyText}`;
            const energyProgress = (player.energy / 50000) * 100;
            const energyTextElement = document.getElementById("energy-fill").querySelector(".progress-text");
            document.getElementById("energy-fill").style.width = `${energyProgress}%`;
            energyTextElement.textContent = `${player.energy}/50000`;
            const energyTextWidth = energyTextElement.offsetWidth / document.getElementById("energy-fill").parentElement.offsetWidth * 100;
            energyTextElement.style.left = `${energyProgress / 2 - energyTextWidth / 2}%`;
            updateCrimeButtons(true);
        } else {
            if (window.countdownInterval) {
                clearInterval(window.countdownInterval);
                window.countdownInterval = null;
            }
            if (window.energyCountdownInterval) {
                clearInterval(window.energyCountdownInterval);
                window.energyCountdownInterval = null;
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
                        <button ${owned || player.cash < item.price ? "disabled" : ""} onclick="buyItem('${item.name}')">Buy</button>
                        <p>${item.name}: $${item.price} - ${item.tooltip}</p>
                    </div>`;
            }
            document.getElementById("market-list").innerHTML = marketList;
        }

        const healthTextElement = document.getElementById("health-fill").querySelector(".progress-text");
        document.getElementById("health-fill").style.width = `${player.health}%`;
        document.getElementById("health-fill").style.backgroundColor = player.health < 100 ? '#FF0000' : '#00FF00';
        healthTextElement.textContent = `${player.health}/100`;
        const healthTextWidth = healthTextElement.offsetWidth / document.getElementById("health-fill").parentElement.offsetWidth * 100;
        healthTextElement.style.left = `${player.health / 2 - healthTextWidth / 2}%`;
        const healthTextElementProfile = document.getElementById("health-fill-profile").querySelector(".progress-text");
        document.getElementById("health-fill-profile").style.width = `${player.health}%`;
        document.getElementById("health-fill-profile").style.backgroundColor = player.health < 100 ? '#FF0000' : '#00FF00';
        healthTextElementProfile.textContent = `${player.health}/100`;
        healthTextElementProfile.style.left = `${player.health / 2 - healthTextWidth / 2}%`;
    } catch (e) {
        console.error("UI update error:", e);
        document.getElementById("crime-list").innerHTML = "<p>Error loading crimes. Check console.</p>";
        if (window.countdownInterval) {
            clearInterval(window.countdownInterval);
            window.countdownInterval = null;
        }
        if (window.energyCountdownInterval) {
            clearInterval(window.energyCountdownInterval);
            window.energyCountdownInterval = null;
        }
    }
}

function updateCrimeButtons(fullUpdate = true) {
    const now = Date.now();
    let bribeActive = player.items.includes("Bribe");
    if (fullUpdate) {
        let crimeList = "";
        for (let crime of crimes) {
            let canAttempt = true;
            let status = crime.tooltip;
            let successChance = (crime.baseSuccess || 0) + ((player.successCount[crime.name] || 0) * (crime.successIncrement || 0));
            let itemBonus = 0;
            if (bribeActive) itemBonus += 10;
            if (crime.name === "Pickpocketing" && player.items.includes("Crowbar")) itemBonus += 5;
            if (crime.name === "Speakeasy Heist" && player.items.includes("Revolver")) itemBonus += 10;
            successChance = Math.min(100, successChance + itemBonus);
            if (crime.name === "Speakeasy Heist" && player.xp < 2500) {
                canAttempt = false;
                status = "Need Capo rank (2500 XP)";
            } else if (crime.energy && player.energy < crime.energy) {
                canAttempt = false;
                status = `Need ${crime.energy} Energy`;
            } else if (crime.maxPerDay) {
                const attempts = player.crimeAttempts[crime.name].timestamps.filter(t => now - t < 86400000);
                if (attempts.length >= crime.maxPerDay) {
                    canAttempt = false;
                    const earliest = Math.min(...player.crimeAttempts[crime.name].timestamps);
                    const remainingMs = 86400000 - (now - earliest);
                    status = `Next attempt in ${formatCountdown(remainingMs)}`;
                    if (!window.countdownInterval) {
                        window.countdownInterval = setInterval(() => {
                            if (!document.getElementById("crimes").classList.contains("active")) {
                                clearInterval(window.countdownInterval);
                                window.countdownInterval = null;
                                return;
                            }
                            const selection = window.getSelection();
                            const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
                            const newNow = Date.now();
                            const newRemainingMs = 86400000 - (newNow - earliest);
                            if (newRemainingMs <= 0) {
                                player.crimeAttempts[crime.name].timestamps = player.crimeAttempts[crime.name].timestamps.filter(t => newNow - t < 86400000);
                                clearInterval(window.countdownInterval);
                                window.countdownInterval = null;
                                updateCrimeButtons(true);
                                if (range) {
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                }
                                return;
                            }
                            const statusElement = document.querySelector(`#crime-list .bordered:nth-child(${crimes.indexOf(crime) + 1}) p:nth-child(2)`);
                            if (statusElement) {
                                statusElement.textContent = `Status: Next attempt in ${formatCountdown(newRemainingMs)}`;
                            }
                            if (range) {
                                selection.removeAllRanges();
                                selection.addRange(range);
                            }
                        }, 1000);
                    }
                }
            }
            const resultMessage = player.crimeResults[crime.name] || "";
            const tempSpan = document.createElement('span');
            tempSpan.className = 'success-text';
            tempSpan.style.fontSize = '14px';
            tempSpan.style.position = 'absolute';
            tempSpan.style.visibility = 'hidden';
            tempSpan.textContent = `${successChance.toFixed(1)}%`;
            document.body.appendChild(tempSpan);
            const successTextWidth = tempSpan.offsetWidth / 500 * 100;
            document.body.removeChild(tempSpan);
            crimeList += `
                <div class="bordered">
                    <p>${crime.name}: $${crime.cash[0]}-$${crime.cash[1]}, ${crime.xp} XP, ${crime.influence} Influence${crime.gold ? `, ${crime.gold[0]}-${crime.gold[1]} Gold` : ""}, ${crime.energy ? crime.energy + " Energy" : crime.maxPerDay + "/day"} (Success: ${successChance.toFixed(1)}%)</p>
                    <p>Status: ${status}</p>
                    <div class="crime-action">
                        <button ${canAttempt ? "" : "disabled"} onclick="commitCrime('${crime.name}')">Attempt</button>
                        ${resultMessage ? `<p>${resultMessage}</p>` : ""}
                    </div>
                    <div class="progress-bar"><div class="success-fill" style="width: ${successChance}%"><span class="success-text" style="left: ${successChance / 2 - successTextWidth / 2}%">${successChance.toFixed(1)}%</span></div></div>
                </div>`;
        }
        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        document.getElementById("crime-list").innerHTML = crimeList || "<p>No crimes available.</p>";
        if (range) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
    } else {
        for (let i = 0; i < crimes.length; i++) {
            const crime = crimes[i];
            let canAttempt = true;
            let status = crime.tooltip;
            let successChance = (crime.baseSuccess || 0) + ((player.successCount[crime.name] || 0) * (crime.successIncrement || 0));
            let itemBonus = 0;
            if (bribeActive) itemBonus += 10;
            if (crime.name === "Pickpocketing" && player.items.includes("Crowbar")) itemBonus += 5;
            if (crime.name === "Speakeasy Heist" && player.items.includes("Revolver")) itemBonus += 10;
            successChance = Math.min(100, successChance + itemBonus);
            if (crime.name === "Speakeasy Heist" && player.xp < 2500) {
                canAttempt = false;
                status = "Need Capo rank (2500 XP)";
            } else if (crime.energy && player.energy < crime.energy) {
                canAttempt = false;
                status = `Need ${crime.energy} Energy`;
            } else if (crime.maxPerDay) {
                const attempts = player.crimeAttempts[crime.name].timestamps.filter(t => now - t < 86400000);
                if (attempts.length >= crime.maxPerDay) {
                    canAttempt = false;
                    const earliest = Math.min(...player.crimeAttempts[crime.name].timestamps);
                    const remainingMs = 86400000 - (now - earliest);
                    status = `Next attempt in ${formatCountdown(remainingMs)}`;
                }
            }
            const crimeElement = document.querySelector(`#crime-list .bordered:nth-child(${i + 1})`);
            if (crimeElement) {
                const button = crimeElement.querySelector("button");
                const statusElement = crimeElement.querySelector("p:nth-child(2)");
                if (button) button.disabled = !canAttempt;
                if (statusElement) statusElement.textContent = `Status: ${status}`;
            }
        }
    }
}

function commitCrime(crimeName) {
    try {
        const crime = crimes.find(c => c.name === crimeName);
        if (!crime) {
            player.crimeResults[crimeName] = "Crime not found.";
            updateUI();
            return;
        }

        let successChance = (crime.baseSuccess || 0) + ((player.successCount[crimeName] || 0) * (crime.successIncrement || 0));
        let itemBonus = player.items.includes("Bribe") ? 10 : 0;
        if (crimeName === "Pickpocketing" && player.items.includes("Crowbar")) itemBonus += 5;
        if (crimeName === "Speakeasy Heist" && player.items.includes("Revolver")) itemBonus += 10;
        successChance = Math.min(100, successChance + itemBonus);

        if (crimeName === "Speakeasy Heist" && player.xp < 2500) {
            player.crimeResults[crimeName] = "Need Capo rank (2500 XP)";
            updateUI();
            return;
        }

        if (crime.energy && player.energy < crime.energy) {
            player.crimeResults[crimeName] = `Need ${crime.energy} Energy`;
            updateUI();
            return;
        }

        if (crime.maxPerDay) {
            const now = Date.now();
            const attempts = player.crimeAttempts[crimeName].timestamps.filter(t => now - t < 86400000);
            if (attempts.length >= crime.maxPerDay) {
                player.crimeResults[crimeName] = "Max attempts reached today.";
                updateUI();
                return;
            }
            player.crimeAttempts[crimeName].timestamps.push(now);
        }

        if (crime.energy) {
            player.energy -= crime.energy;
        }

        const roll = Math.random() * 100;
        const success = roll <= successChance;
        player.successCount[crimeName] = (player.successCount[crimeName] || 0) + (success ? 1 : 0);

        if (success) {
            const cash = Math.floor(Math.random() * (crime.cash[1] - crime.cash[0] + 1)) + crime.cash[0];
            player.cash += cash;
            player.xp += crime.xp;
            player.influence += crime.influence;
            let result = `Success! Gained $${cash}, ${crime.xp} XP, ${crime.influence} Influence`;
            if (crime.gold) {
                const gold = Math.floor(Math.random() * (crime.gold[1] - crime.gold[0] + 1)) + crime.gold[0];
                player.gold += gold;
                result += `, ${gold} Gold`;
            }
            player.crimeResults[crimeName] = result;
            if (crimeName === "Pickpocketing") {
                player.health = Math.max(0, player.health - Math.floor(Math.random() * 10));
            }
        } else {
            player.crimeResults[crimeName] = "Failed: Try again!";
            if (crimeName === "Pickpocketing") {
                player.health = Math.max(0, player.health - Math.floor(Math.random() * 20));
            } else {
                player.health = Math.max(0, player.health - Math.floor(Math.random() * 40));
            }
        }

        savePlayer();
        updateUI();
    } catch (e) {
        console.error("Error committing crime:", e);
        player.crimeResults[crimeName] = "Error committing crime.";
        updateUI();
    }
}

function buyItem(itemName) {
    try {
        const item = market.find(i => i.name === itemName);
        if (!item) {
            console.error("Item not found:", itemName);
            return;
        }
        if (player.cash < item.price || player.items.includes(itemName)) {
            console.error("Cannot buy item:", itemName);
            return;
        }
        player.cash -= item.price;
        player.items.push(itemName);
        savePlayer();
        updateUI();
    } catch (e) {
        console.error("Error buying item:", e);
    }
}

function gamble(amount) {
    try {
        amount = parseInt(amount);
        if (isNaN(amount) || amount <= 0 || player.cash < amount) {
            console.error("Invalid bet:", amount);
            document.getElementById("gamble-result").textContent = "Invalid bet: Must be a positive number and less than or equal to your cash.";
            document.getElementById("speakeasy").dataset.resultSet = "true";
            return;
        }
        player.cash -= amount;
        const roll = Math.random();
        if (roll < 0.5) {
            player.cash += amount * 2;
            document.getElementById("gamble-result").textContent = `Won $${amount * 2}!`;
        } else {
            document.getElementById("gamble-result").textContent = `Lost $${amount}.`;
        }
        document.getElementById("speakeasy").dataset.resultSet = "true";
        savePlayer();
        updateUI();
    } catch (e) {
        console.error("Gambling error:", e);
        document.getElementById("gamble-result").textContent = "Error gambling.";
        document.getElementById("speakeasy").dataset.resultSet = "true";
    }
}

function gambleGold(amount) {
    try {
        amount = parseInt(amount);
        if (isNaN(amount) || amount <= 0 || player.gold < amount) {
            console.error("Invalid gold bet:", amount);
            document.getElementById("gamble-result").textContent = "Invalid gold bet: Must be a positive number and less than or equal to your gold.";
            document.getElementById("speakeasy").dataset.resultSet = "true";
            return;
        }
        player.gold -= amount;
        const roll = Math.random();
        if (roll < 0.5) {
            player.gold += amount * 2;
            document.getElementById("gamble-result").textContent = `Won ${amount * 2} Gold!`;
        } else {
            document.getElementById("gamble-result").textContent = `Lost ${amount} Gold.`;
        }
        document.getElementById("speakeasy").dataset.resultSet = "true";
        savePlayer();
        updateUI();
    } catch (e) {
        console.error("Gold gambling error:", e);
        document.getElementById("gamble-result").textContent = "Error gambling gold.";
        document.getElementById("speakeasy").dataset.resultSet = "true";
    }
}

function logout() {
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

function showTab(tabId) {
    try {
        document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
        document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
        document.getElementById(tabId).classList.add("active");
        document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add("active");
        player.crimeResults = {};
        updateUI();
    } catch (e) {
        console.error("Error in showTab:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadPlayer();
    updateUI();
    showTab('crimes');
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    if (player.energy < 50000) {
        window.energyCountdownInterval = setInterval(() => {
            if (!document.getElementById("crimes").classList.contains("active")) {
                clearInterval(window.energyCountdownInterval);
                window.energyCountdownInterval = null;
                return;
            }
            const selection = window.getSelection();
            const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
            const now = Date.now();
            const msSinceLastTick = now - player.lastEnergyTick;
            if (msSinceLastTick >= 60000) {
                player.energy = Math.min(50000, player.energy + 5);
                player.lastEnergyTick += 60000;
                player.lastEnergyUpdate = now;
                savePlayer();
                if (player.energy >= 50000) {
                    clearInterval(window.energyCountdownInterval);
                    window.energyCountdownInterval = null;
                }
            }
            document.getElementById("energy-text").textContent = `Energy: ${player.energy < 50000 ? `${player.energy} (+5 in ${formatEnergyCountdown()})` : player.energy}`;
            const energyProgress = (player.energy / 50000) * 100;
            const energyTextElement = document.getElementById("energy-fill").querySelector(".progress-text");
            document.getElementById("energy-fill").style.width = `${energyProgress}%`;
            const energyTextWidth = energyTextElement.offsetWidth / document.getElementById("energy-fill").parentElement.offsetWidth * 100;
            energyTextElement.style.left = `${energyProgress / 2 - energyTextWidth / 2}%`;
            energyTextElement.textContent = `${player.energy}/50000`;
            updateCrimeButtons(false);
            if (range) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }, 1000);
    }
});