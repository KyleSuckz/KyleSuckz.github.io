import { player, savePlayer } from './player.js';

export function updateEnergy() {
    const now = Date.now();
    const minutesPassed = Math.floor((now - player.lastEnergyTick) / 60000);
    if (minutesPassed >= 1) {
        player.energy = Math.min(10000, player.energy + (minutesPassed * 5));
        player.lastEnergyTick += minutesPassed * 60000;
        player.lastEnergyUpdate = now;
    }
    savePlayer();
}

export function formatCountdown(ms) {
    if (ms <= 0) return "0h 0m 0s";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
}

export function formatEnergyCountdown() {
    const now = Date.now();
    const msSinceLastTick = now - player.lastEnergyTick;
    const msUntilNextMinute = 60000 - (msSinceLastTick % 60000);
    if (msUntilNextMinute <= 0) return "00:00";
    const minutes = Math.floor(msUntilNextMinute / 60000);
    const seconds = Math.floor((msUntilNextMinute % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}