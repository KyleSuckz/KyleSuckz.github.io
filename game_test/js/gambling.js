import { player, savePlayer } from './player.js';

export const market = [
    { name: "Crowbar", price: 10, effect: { crime: "Pickpocketing", success: 5 }, tooltip: "Boosts Pickpocketing by 5% (1 max)." },
    { name: "Revolver", price: 50, effect: { crime: "Speakeasy Heist", success: 10 }, tooltip: "Boosts Speakeasy Heist by 10% (1 max)." },
    { name: "Bribe", price: 100, effect: { success: 10 }, tooltip: "Boosts all crime success by 10% (1 max)." },
    { name: "Gold", price: 10000, tooltip: "Trade $10,000 for a shiny gold coin." }
];

export function gamble() {
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
    } catch (e) {
        console.error("Error in gamble:", e);
        document.getElementById("gamble-result").textContent = "Error: Try again!";
        document.getElementById("speakeasy").dataset.resultSet = "true";
    }
}

export function gambleGold() {
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
    } catch (e) {
        console.error("Error in gambleGold:", e);
        document.getElementById("gamble-result").textContent = "Error: Try again!";
        document.getElementById("speakeasy").dataset.resultSet = "true";
    }
}

export function buyItem(itemName) {
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
    } catch (e) {
        console.error("Error in buyItem:", e);
    }
}