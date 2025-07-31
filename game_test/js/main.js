import { loadPlayer } from './player.js';
import { updateUI, showTab } from './ui.js';
import { gamble, gambleGold, buyItem } from './gambling.js';
import { commitCrime } from './crimes.js';
import { logout } from './player.js';

window.gamble = gamble;
window.gambleGold = gambleGold;
window.buyItem = buyItem;
window.commitCrime = commitCrime;
window.showTab = showTab;
window.logout = logout;

window.onload = function() {
    console.log("Window loaded, initializing game...");
    try {
        loadPlayer();
        updateUI();
    } catch (e) {
        console.error("Error in window.onload:", e);
        document.getElementById("crime-list").innerHTML = "<p>Error initializing game. Check console.</p>";
    }
};