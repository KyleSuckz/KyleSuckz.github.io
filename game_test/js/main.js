import { loadPlayer } from './player.js';
import { updateUI, showTab } from './ui.js';
import { updateEnergy } from './utils.js';

window.onload = function() {
    console.log("Window loaded, initializing game...");
    loadPlayer();
    updateEnergy();
    updateUI();
    showTab('crimes');
};