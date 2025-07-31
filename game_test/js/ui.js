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
            if (energyCountdownInterval) {
                clearInterval(energyCountdownInterval);
                energyCountdownInterval = null;
            }
            if (player.energy < 50000) {
                energyCountdownInterval = setInterval(() => {
                    if (!document.getElementById("crimes").classList.contains("active")) {
                        clearInterval(energyCountdownInterval);
                        energyCountdownInterval = null;
                        return;
                    }
                    // Preserve text selection
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
                            clearInterval(energyCountdownInterval);
                            energyCountdownInterval = null;
                        }
                    }
                    document.getElementById("energy-text").textContent = `Energy: ${player.energy < 50000 ? `${player.energy} (+5 in ${formatEnergyCountdown()})` : player.energy}`;
                    const newEnergyProgress = (player.energy / 50000) * 100;
                    document.getElementById("energy-fill").style.width = `${newEnergyProgress}%`;
                    const newEnergyTextWidth = energyTextElement.offsetWidth / document.getElementById("energy-fill").parentElement.offsetWidth * 100;
                    energyTextElement.style.left = `${newEnergyProgress / 2 - newEnergyTextWidth / 2}%`;
                    energyTextElement.textContent = `${player.energy}/50000`;
                    updateCrimeButtons(false); // Incremental update
                    // Restore text selection
                    if (range) {
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }, 1000);
            }
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
                    if (!countdownInterval) {
                        countdownInterval = setInterval(() => {
                            if (!document.getElementById("crimes").classList.contains("active")) {
                                clearInterval(countdownInterval);
                                countdownInterval = null;
                                return;
                            }
                            // Preserve text selection
                            const selection = window.getSelection();
                            const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
                            const newNow = Date.now();
                            const newRemainingMs = 86400000 - (newNow - earliest);
                            if (newRemainingMs <= 0) {
                                player.crimeAttempts[crime.name].timestamps = player.crimeAttempts[crime.name].timestamps.filter(t => newNow - t < 86400000);
                                clearInterval(countdownInterval);
                                countdownInterval = null;
                                updateCrimeButtons(true); // Full update on reset
                                // Restore text selection
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
                            // Restore text selection
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
                        <button ${canAttempt ? "" : "disabled"} data-crime="${crime.name}">Attempt</button>
                        ${resultMessage ? `<p>${resultMessage}</p>` : ""}
                    </div>
                    <div class="progress-bar"><div class="success-fill" style="width: ${successChance}%"><span class="success-text" style="left: ${successChance / 2 - prospectTextWidth / 2}%">${successChance.toFixed(1)}%</span></div></div>
                </div>`;
        }
        // Preserve text selection
        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        document.getElementById("crime-list").innerHTML = crimeList || "<p>No crimes available.</p>";
        // Add event listeners for crime buttons
        document.querySelectorAll('#crime-list button[data-crime]').forEach(button => {
            button.addEventListener('click', () => commitCrime(button.dataset.crime));
        });
        // Restore text selection
        if (range) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
    } else {
        // Incremental update: only update button states and status
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

export function showTab(tabId) {
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

window.showTab = showTab;