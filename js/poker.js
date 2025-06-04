document.addEventListener('DOMContentLoaded', () => {
    const startGame = document.getElementById('start-game');
    const continuePlaying = document.getElementById('continue-playing');
    const foldBtn = document.getElementById('fold-btn');
    const checkBtn = document.getElementById('check-btn');
    const callBtn = document.getElementById('call-btn');
    const raiseBtn = document.getElementById('raise-btn');
    const newHand = document.getElementById('new-hand');
    const resetGame = document.getElementById('reset-game');
    const hideLog = document.getElementById('hide-log');
    const logContent = document.getElementById('log-content');
    const dealBtns = [document.getElementById('deal-btn'), document.getElementById('deal-btn1'), document.getElementById('deal-btn2'), document.getElementById('deal-btn3')];

    startGame.addEventListener('click', () => alert('Game started!'));
    continuePlaying.addEventListener('click', () => alert('Continuing game!'));
    foldBtn.addEventListener('click', () => alert('Folded!'));
    checkBtn.addEventListener('click', () => alert('Checked!'));
    callBtn.addEventListener('click', () => alert('Called!'));
    raiseBtn.addEventListener('click', () => alert('Raised!'));
    newHand.addEventListener('click', () => alert('New hand!'));
    resetGame.addEventListener('click', () => alert('Game reset!'));
    hideLog.addEventListener('click', () => {
        logContent.style.display = logContent.style.display === 'none' ? 'block' : 'none';
    });

    dealBtns.forEach(btn => {
        btn.addEventListener('click', () => alert('Dealt!'));
    });
});