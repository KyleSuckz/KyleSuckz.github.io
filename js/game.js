(function() {
    console.log('Game script loaded');
    
    class BootScene extends Phaser.Scene {
        constructor() {
            super({ key: 'BootScene' });
        }
        preload() {
            console.log('BootScene: Starting preload');
            try {
                // Attempt to load assets, but continue if they fail
                this.load.image('city', 'assets/images/city_background.png');
                this.load.spritesheet('player', 'assets/images/1920s_character.png', { frameWidth: 32, frameHeight: 48 });
                this.load.image('car', 'assets/images/ford_model_t.png');
            } catch (error) {
                console.error('BootScene: Error setting up asset loading:', error);
            }

            this.load.on('filecomplete', (key) => {
                console.log(`BootScene: Loaded asset: ${key}`);
            });
            this.load.on('loaderror', (file) => {
                console.error(`BootScene: Failed to load asset: ${file.key} at ${file.src}`);
            });

            this.load.on('complete', () => {
                console.log('BootScene: Preload complete, starting MenuScene');
                this.scene.start('MenuScene');
            });
        }
        create() {
            console.log('BootScene: Create called, starting MenuScene');
            this.scene.start('MenuScene');
        }
    }

    class MenuScene extends Phaser.Scene {
        constructor() {
            super({ key: 'MenuScene' });
        }
        create() {
            console.log('MenuScene: Creating');
            try {
                this.add.text(100, 50, '1920s Bootlegger Mafia', { fontSize: '32px', color: '#fff' });
                this.add.text(100, 150, 'Click to Start', { fontSize: '24px', color: '#fff' }).setInteractive()
                    .on('pointerdown', () => {
                        console.log('MenuScene: Starting GameScene');
                        this.scene.start('GameScene');
                    });
                if (!this.textures.exists('city')) {
                    this.add.text(100, 250, 'Warning: Background image not loaded', { fontSize: '20px', color: '#f00' });
                }
            } catch (error) {
                console.error('MenuScene: Error creating scene:', error);
            }
        }
    }

    class GameScene extends Phaser.Scene {
        constructor() {
            super({ key: 'GameScene' });
        }
        create() {
            console.log('GameScene: Creating');
            try {
                if (this.textures.exists('city')) {
                    this.add.image(400, 300, 'city');
                } else {
                    this.add.text(100, 50, 'No Background', { fontSize: '20px', color: '#f00' });
                    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5);
                }

                if (this.textures.exists('car')) {
                    this.add.sprite(200, 200, 'car');
                } else {
                    this.add.text(200, 200, 'Car', { fontSize: '16px', color: '#f00' });
                }

                this.player = this.textures.exists('player')
                    ? this.add.sprite(100, 100, 'player')
                    : this.add.text(100, 100, 'Player', { fontSize: '16px', color: '#f00' });
                this.player.id = 'player_' + Math.random().toString(36).substr(2, 9);

                this.otherPlayers = {};

                this.cursors = this.input.keyboard.createCursorKeys();

                try {
                    if (!localStorage.getItem('mafia_players')) {
                        localStorage.setItem('mafia_players', JSON.stringify({}));
                    }
                } catch (error) {
                    console.error('GameScene: Error initializing localStorage:', error);
                }

                this.updatePlayerStorage();

                window.addEventListener('storage', () => {
                    console.log('GameScene: Storage event detected');
                    this.updateOtherPlayers();
                });

                this.updateOtherPlayers();
            } catch (error) {
                console.error('GameScene: Error creating scene:', error);
            }
        }
        update() {
            try {
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

                this.player.x = Phaser.Math.Clamp(this.player.x, 0, 800);
                this.player.y = Phaser.Math.Clamp(this.player.y, 0, 600);

                this.updatePlayerStorage();
            } catch (error) {
                console.error('GameScene: Error in update:', error);
            }
        }
        updatePlayerStorage() {
            try {
                let players = JSON.parse(localStorage.getItem('mafia_players'));
                players[this.player.id] = { x: this.player.x, y: this.player.y };
                localStorage.setItem('mafia_players', JSON.stringify(players));
                console.log(`GameScene: Updated player ${this.player.id} at (${this.player.x}, ${this.player.y})`);
            } catch (error) {
                console.error('GameScene: Error updating localStorage:', error);
            }
        }
        updateOtherPlayers() {
            try {
                let players = JSON.parse(localStorage.getItem('mafia_players'));
                for (let id in players) {
                    if (id !== this.player.id) {
                        if (!this.otherPlayers[id]) {
                            this.otherPlayers[id] = this.textures.exists('player')
                                ? this.add.sprite(players[id].x, players[id].y, 'player')
                                : this.add.text(players[id].x, players[id].y, 'P', { fontSize: '16px', color: '#f00' });
                            this.otherPlayers[id].id = id;
                            console.log(`GameScene: Added player ${id} at (${players[id].x}, ${players[id].y})`);
                        } else {
                            this.otherPlayers[id].setPosition(players[id].x, players[id].y);
                        }
                    }
                }
                for (let id in this.otherPlayers) {
                    if (!players[id]) {
                        this.otherPlayers[id].destroy();
                        delete this.otherPlayers[id];
                        console.log(`GameScene: Removed player ${id}`);
                    }
                }
            } catch (error) {
                console.error('GameScene: Error updating other players:', error);
            }
        }
    }

    // Initialize Phaser immediately
    console.log('Phaser game initializing');
    try {
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'game-container',
            scene: [BootScene, MenuScene, GameScene]
        };
        const game = new Phaser.Game(config);
        console.log('Phaser game initialized successfully');
    } catch (error) {
        console.error('Error initializing Phaser game:', error);
        const div = document.getElementById('game-container');
        if (div) {
            div.innerHTML = '<p style="color: red; font-size: 20px;">Error: Failed to initialize game. Check console.</p>';
        }
    }
})();