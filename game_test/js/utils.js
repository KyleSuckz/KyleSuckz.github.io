import { player, savePlayer } from './player.js';

export function updateEnergy() {
    try {
        const now = Date.now();
        const msSinceLastUpdate = now - player.lastEnergyUpdate;
        if (msSinceLastUpdate >= 60000) {
            const ticks = Math.floor(msSinceLastUpdate / 60000);
            player.energy = Math.min(50000, player.energy + (ticks * 5)); // Enforce 50,000 cap
            player.lastEnergyUpdate = now;
            player.lastEnergyTick = now;
            savePlayer();
        }
    } catch (e) {
        console.error("Error in updateEnergy:", e);
    }
}

export function formatCountdown(ms) {
    try {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    } catch (e) {
        console.error("Error in formatCountdown:", e);
        return "00h 00m 00s";
    }
}

export function formatEnergyCountdown() {
    try {
        const now = Date.now();
        const msSinceLastTick = now - player.lastEnergyTick;
        const msTillNextTick = 60000 - (msSinceLastTick % 60000);
        const seconds = Math.floor(msTillNextTick / 1000);
        return `${seconds.toString().padStart(2, '0')}s`;
    } catch (e) {
        console.error("Error in formatEnergyCountdown:", e);
        return "00s";
    }
}