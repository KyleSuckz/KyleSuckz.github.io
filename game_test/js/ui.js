import { player, savePlayer, updateRank } from './player.js';
import { crimes } from './crimes.js';
import { market } from './gambling.js';
import { updateEnergy, formatCountdown, formatEnergyCountdown } from './utils.js';

let countdownInterval = null;
let energyCountdownInterval = null;

export function updateUI() {
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
        const rankText = player.rank === "Boss" ? `${player.xp}/${rankThreshold}` : `${player.xp}/${rankThreshold} to ${nextRank}`;
        document.getElementById("rank-fill").style.width = `${rankProgress}%`;
        document.getElementById("rank-fill").querySelector(".progress-text").textContent = rankText;
        document.getElementById("rank-fill-profile").style.width = `${rankProgress}%`;
        document.getElementById("rank-fill-profile").querySelector(".progress-text").textContent = rankText;

        const crimesTab = document.getElementById("crimes");
        if (crimesTab.classList.contains("active")) {
            const energyText = player.energy < 10000 ? `${player.energy} (+5 in ${formatEnergyCountdown()})` : `${player.energy}`;
            document.getElementById("energy-text").textContent = energyText;
            document.getElementById("energy-fill").style.width = `${(player.energy / 10000) * 100}%`;
            document.getElementById("energy-fill").querySelector(".progress-text").textContent = `${player.energy}/10000`;

            if (energyCountdownInterval) {
                clearInterval(energyCountdownInterval);
                energyCountdownInterval = null;
            }

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

            let crimeList = "";
            const now = Date.now();
            let bribeActive = player.items.includes("Bribe");

            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }

            for (let crime of crimes) {
                let canAttempt = true;
                let status = crime.tooltip;
                let successChance = crime.baseSuccess + (player.successCount[crime.name] * crime.successIncrement);
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
                        <p>${crime.name}: $${crime.cash[0]}-$${crime.cash[1]}, ${crime.xp} XP, ${crime.influence} Influence${crime.gold ? `, ${crime.gold[0]}-${crime.gold[1]} Gold` : ""}, ${crime.energy ? crime.energy + " Energy" : "3/day"} (Success: ${successChance.toFixed(1)}%)</p>
                        <p>Status: ${status}</p>
                        <div class="crime-action">
                            <button ${canAttempt ? "" : "disabled"} onclick="commitCrime('${crime.name}')">Attempt</button>
                            ${resultMessage ? `<p>${resultMessage}</p>` : ""}
                        </div>
                        <div class="progress-bar"><div class="success-fill" style="width: ${successChance}%"><span class="success-text">${successChance.toFixed(1)}%</span></div></div>
                    </div>`;
            }
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
            let inventoryList = "<h3>Owned Items</h3>";
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
            document.getElementById("inventory-list").innerHTML = inventoryList;

            let marketList = "";
            for (let item of market) {
                const owned = player.items.includes(item.name) && item.name !== "Gold";
                marketList += `
                    <div class="bordered black-market">
                        <button ${owned || player.cash < item.price ? "disabled" : ""} onclick="buyItem('${item.name}')">Buy</button>
                        <p>${item.name}: $${item.price} - ${item.tooltip}</p>
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

export function showTab(tabId) {
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