import { player, savePlayer } from './player.js';

export function formatCountdown(ms) {
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

export function formatEnergyCountdown() {
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

export function updateEnergy() {
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