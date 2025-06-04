document.addEventListener('DOMContentLoaded', () => {
    let cash = 100000000;
    const cashDisplay = document.getElementById('cash-display');
    const betAmount = document.getElementById('bet-amount');
    const betBtn = document.getElementById('bet-btn');
    const showOptions = document.getElementById('show-options');
    const saveNumbers = document.getElementById('save-numbers');
    const resetBtn = document.getElementById('reset-btn');
    const randomNumbers = document.getElementById('random-numbers');
    const showStats = document.getElementById('show-stats');
    const hideSavedSets = document.getElementById('hide-saved-sets');
    const payouts = document.getElementById('payouts');
    const odds = document.getElementById('odds');

    cashDisplay.textContent = `Cash: $${cash.toLocaleString()}`;

    betBtn.addEventListener('click', () => {
        const amount = parseInt(betAmount.value);
        if (amount > 0 && amount <= cash) {
            cash -= amount;
            cashDisplay.textContent = `Cash: $${cash.toLocaleString()}`;
            alert(`Bet of $${amount} placed!`); // Placeholder for game logic
        } else {
            alert('Invalid bet amount!');
        }
    });

    // Placeholder event listeners for other buttons
    showOptions.addEventListener('click', () => alert('Options shown!'));
    saveNumbers.addEventListener('click', () => alert('Numbers saved!'));
    resetBtn.addEventListener('click', () => alert('Reset!'));
    randomNumbers.addEventListener('click', () => alert('Random numbers generated!'));
    showStats.addEventListener('click', () => alert('Stats shown!'));
    hideSavedSets.addEventListener('click', () => alert('Saved sets hidden!'));
    payouts.addEventListener('click', () => alert('Payouts shown!'));
    odds.addEventListener('click', () => alert('Odds shown!'));
});