import { player, savePlayer } from './player.js';
import { updateUI } from './ui.js';

export const market = [
    { name: "Bribe", price: 1000, tooltip: "+10% success chance to all crimes." },
    { name: "Crowbar", price: 500, tooltip: "+5% success chance to Pickpocketing." },
    { name: "Revolver", price: 2000, tooltip: "+10% success chance to Speakeasy Heist." }
];

export function buyItem(itemName) {
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

export function gamble(amount) {
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

export function gambleGold(amount) {
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

document.addEventListener('DOMContentLoaded', () => {
    const cashBetButton = document.querySelector('#speakeasy button[data-gamble="cash"]');
    const goldBetButton = document.querySelector('#speakeasy button[data-gamble="gold"]');
    if (cashBetButton) {
        cashBetButton.addEventListener('click', () => {
            const amount = document.getElementById("bet-amount").value;
            gamble(amount);
        });
    }
    if (goldBetButton) {
        goldBetButton.addEventListener('click', () => {
            const amount = document.getElementById("gold-bet-amount").value;
            gambleGold(amount);
        });
    }
});