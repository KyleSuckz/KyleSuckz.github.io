class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    console.log('BootScene: Starting preload');
    // Load assets (replace with your actual asset keys and paths)
    this.load.image('city', 'assets/city.png');
    this.load.image('player', 'assets/player.png');
    this.load.image('car', 'assets/car.png');
  }

  create() {
    console.log('BootScene: Create called, starting MenuScene');
    this.scene.start('MenuScene');
  }
}

class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    console.log('MenuScene: Creating');
    // Add start button
    const startButton = this.add.text(400, 300, 'Start Game', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#000000'
    }).setOrigin(0.5).setInteractive();

    startButton.on('pointerdown', () => {
      console.log('MenuScene: Starting GameScene');
      this.scene.start('GameScene');
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.players = {};
  }

  create() {
    console.log('GameScene: Creating');
    // Add background
    this.add.image(400, 300, 'city').setOrigin(0.5);

    // Clear existing players
    if (this.playerGroup) {
      this.playerGroup.clear(true, true);
    }
    Object.values(this.players).forEach(player => player.destroy());
    this.players = {};

    // Initialize player group with Arcade physics
    this.playerGroup = this.physics.add.group();

    // Add local player
    this.addPlayer('player_7g9ysvc8d', 100, 100);

    // Set up keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    // Update local player position
    const player = this.players['player_7g9ysvc8d'];
    if (player) {
      let newX = player.x;
      let newY = player.y;

      // Movement logic
      if (this.cursors.left.isDown) newX -= 2;
      if (this.cursors.right.isDown) newX += 2;
      if (this.cursors.up.isDown) newY -= 2;
      if (this.cursors.down.isDown) newY += 2;

      // Only update if position changed
      if (newX !== player.lastX || newY !== player.lastY) {
        this.updatePlayerPosition('player_7g9ysvc8d', newX, newY);
        player.lastX = newX;
        player.lastY = newY;
      }
    }
  }

  addPlayer(id, x, y) {
    if (!this.players[id]) {
      const player = this.add.sprite(x, y, 'player');
      this.playerGroup.add(player);
      this.players[id] = player;
      player.lastX = x;
      player.lastY = y;
      console.log(`GameScene: Added player ${id} at (${x}, ${y})`);
    }
  }

  updatePlayerPosition(id, x, y) {
    const player = this.players[id];
    if (player) {
      player.setPosition(x, y);
      console.log(`GameScene: Updated player ${id} at (${x}, ${y})`);
    }
  }
}

// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: [BootScene, MenuScene, GameScene],
  canvas: document.getElementById('game-canvas'),
  context: {
    willReadFrequently: true // Optimize canvas readbacks
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
};

// Initialize game
console.log('Game script loaded');
const game = new Phaser.Game(config);
console.log('Phaser game initializing...');