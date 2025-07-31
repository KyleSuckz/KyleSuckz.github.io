import { loadPlayer } from './player.js';
import { updateUI, showTab } from './ui.js';
import { updateEnergy } from './utils.js';

window.onload = function() {
    loadPlayer();
    updateEnergy();
    setTimeout(() => {
        updateUI();
        showTab('crimes');
    }, 0);
};