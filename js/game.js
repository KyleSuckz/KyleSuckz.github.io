class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    preload() {
        this.load.image('city', 'assets/images/city_background.png');
        this.load.spritesheet('player', 'assets/images/1920s_character.png', { frameWidth: 32, frameHeight: 48 });
        this.load.image('car', 'assets/images/ford_model_t.png');
    }
    create() {
        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }
    create() {
        this.add.text(100, 100, '1920s Bootlegger Mafia', { fontSize: '32px', color: '#fff' });
        this.add.text(100, 200, 'Click to Start', { fontSize: '24px', color: '#fff' }).setInteractive()
            .on('pointerdown', () => this.scene.start('GameScene'));
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    create() {
        // Add background and static car
        this.add.image(400, 300, 'city');
        this.add.sprite(200, 200, 'car');

        // Create player sprite
        this.player = this.add.sprite(100, 100, 'player');
        this.player.id = 'player_' + Math.random().toString(36).substr(2, 9);

        // Other players' sprites
        this.otherPlayers = {};

        // Set up keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();

        // Initialize localStorage for players
        if (!localStorage.getItem('mafia_players')) {
            localStorage.setItem('mafia_players', JSON.stringify({}));
        }

        // Update localStorage with this player
        this.updatePlayerStorage();

        // Listen for storage changes (from other tabs)
        window.addEventListener('storage', () => {
            this.updateOtherPlayers();
        });

        // Initial update of other players
        this.updateOtherPlayers();
    }
    update() {
        // Handle player movement
        const speed = 5;
        if (this.cursors.left.isDown) {
            this.player.x -= speed;
        }
        if (this.cursors.right.isDown) {
            this.player.x += speed;
        }
        if (this.cursors.up.isDown) {
            this.player.y -= speed;
        }
        if (this.cursors.down.isDown) {
            this.player.y += speed;
        }

        // Keep player within bounds
        this.player.x = Phaser.Math.Clamp(this.player.x, 0, 800);
        this.player.y = Phaser.Math.Clamp(this.player.y, 0, 600);

        // Update localStorage with new position
        this.updatePlayerStorage();
    }
    updatePlayerStorage() {
        let players = JSON.parse(localStorage.getItem('mafia_players'));
        players[this.player.id] = { x: this.player.x, y: this.player.y };
        localStorage.setItem('mafia_players', JSON.stringify(players));
        console.log(`Updated player ${this.player.id} at (${this.player.x}, ${this.player.y})`);
    }
    updateOtherPlayers() {
        let players = JSON.parse(localStorage.getItem('mafia_players'));
        for (let id in players) {
            if (id !== this.player.id) {
                if (!this.otherPlayers[id]) {
                    this.otherPlayers[id] = this.add.sprite(players[id].x, players[id].y, 'player');
                    this.otherPlayers[id].id = id;
                    console.log(`Added player ${id} at (${players[id].x}, ${players[id].y})`);
                } else {
                    this.otherPlayers[id].setPosition(players[id].x, players[id].y);
                }
            }
        }
        // Remove players no longer in storage
        for (let id in this.otherPlayers) {
            if (!players[id]) {
                this.otherPlayers[id].destroy();
                delete this.otherPlayers[id];
                console.log(`Removed player ${id}`);
            }
        }
    }
}