import { player, savePlayer } from './player.js';
import { updateUI } from './ui.js';

export const crimes = [
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

export function commitCrime(crimeName) {
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

window.commitCrime = commitCrime;