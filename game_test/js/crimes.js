import { player, savePlayer, updateRank } from './player.js';

export const crimes = [
    { name: "Pickpocketing", cash: [1, 5], xp: 5, influence: 2, energy: 10, baseSuccess: 5, successIncrement: 2, tooltip: "Grab some dough from unsuspecting marks." },
    { name: "Bootleg Run", cash: [10, 20], xp: 10, influence: 5, energy: 15, baseSuccess: 5, successIncrement: 1, tooltip: "Smuggle hooch past the coppers." },
    { name: "Speakeasy Heist", cash: [500, 2000], xp: 100, influence: 50, gold: [2, 5], baseSuccess: 5, successIncrement: 0.5, maxPerDay: 3, tooltip: "Knock over a rival juice joint for big dough." }
];

export function commitCrime(crimeName) {
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
                message = `Success: Snagged $${cash}, ${crime.xp} XP, ${crime.influence} Influence, ${gold} Gold.`;
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
    } catch (e) {
        console.error(`Error in commitCrime for ${crimeName}:`, e);
        player.crimeResults[crimeName] = "Error: Try again!";
    }
}