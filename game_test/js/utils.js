import { player, savePlayer } from './player.js';

export function updateEnergy() {
    try {
        const now = Date.now();
        // Only update energy if lastEnergyUpdate is set and valid
        if (player.lastEnergyUpdate && player.lastEnergyUpdate > 0) {
            const msSinceLastUpdate = now - player.lastEnergyUpdate;
            const energyToAdd = Math.floor(msSinceLastUpdate / 60000) * 5;
            if (energyToAdd > 0) {
                player.energy = Math.min(50000, player.energy + energyToAdd);
                player.lastEnergyTick = now - (msSinceLastUpdate % 60000);
                player.lastEnergyUpdate = now;
                savePlayer();
            }
        } else {
            // Initialize timestamps if not set
            player.lastEnergyUpdate = now;
            player.lastEnergyTick = now;
            savePlayer();
        }
    } catch (e) {
        console.error("Error updating energy:", e);
    }
}

export function formatCountdown(ms) {
    if (ms <= 0) return "0s";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours > 0 ? hours + "h " : ""}${minutes > 0 ? minutes + "m " : ""}${seconds}s`;
}

export function formatEnergyCountdown() {
    const now = Date.now();
    const msSinceLastTick = now - player.lastEnergyTick;
    const msUntilNextTick = 60000 - (msSinceLastTick % 60000);
    return formatCountdown(msUntilNextTick);
}