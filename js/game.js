(function() {
    console.log('Game script loaded');

    // Pre-configured Firebase configuration (test instance)
    const firebaseConfig = {
        apiKey: "AIzaSyC6Y3tL3G6y3tL3G6y3tL3G6y3tL3G6y3",
        authDomain: "bootlegger-mafia-test.firebaseapp.com",
        databaseURL: "https://bootlegger-mafia-test-default-rtdb.firebaseio.com",
        projectId: "bootlegger-mafia-test",
        storageBucket: "bootlegger-mafia-test.appspot.com",
        messagingSenderId: "123456789012",
        appId: "1:123456789012:web:abcdef1234567890"
    };

    // Initialize Firebase
    let firebaseApp;
    let useFirebase = true;
    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized');
    } catch (error) {
        console.error('Firebase initialization error, falling back to localStorage:', error);
        useFirebase = false;
    }

    class BootScene extends Phaser.Scene {
        constructor() {
            super({ key: 'BootScene' });
        }
        preload() {
            console.log('BootScene: Starting preload');
            try {
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
                // Background
                if (this.textures.exists('city')) {
                    this.add.image(400, 300, 'city');
                } else {
                    this.add.text(100, 50, 'No Background', { fontSize: '20px', color: '#f00' });
                    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5);
                }

                // Car
                if (this.textures.exists('car')) {
                    this.add.sprite(200, 200, 'car');
                } else {
                    this.add.text(200, 200, 'Car', { fontSize: '20px', color: '#f00' });
                }

                // Player
                this.player = this.textures.exists('player')
                    ? this.add.sprite(100, 100, 'player')
                    : this.add.text(100, 100, 'Player', { fontSize: '16px', color: '#f00' });
                this.player.id = 'player_' + Math.random().toString(36).substring(2, 9);

                // Other players
                this.otherPlayers = {};

                // Keyboard input
                this.cursors = this.input.keyboard.createCursorKeys();

                // Initialize multiplayer
                if (useFirebase) {
                    this.database = firebase.database();
                    this.playersRef = this.database.ref('players');
                    this.updatePlayerFirebase();
                    this.playersRef.on('value', (snapshot) => {
                        console.log('GameScene: Firebase players updated');
                        this.updateOtherPlayers(snapshot.val() || {}));
                    });
                } else {
                    // Fallback to localStorage
                    try {
                        if (!localStorage.getItem('mafia_players')) {
                            localStorage.setItem('mafia_players', JSON.stringify({}));
                        }
                        this.updatePlayerStorage();
                        window.addEventListener('storage', () => {
                            console.log('GameScene: Storage event detected');
                            this.updateOtherPlayers(JSON.parse(localStorage.getItem('mafia_players') || '{}'));
                        });
                        this.updateOtherPlayers(JSON.parse(localStorage.getItem('mafia_players') || '{}'));
                    } catch (error) {
                        console.error('GameScene: Error initializing localStorage:', error);
                    }
                }
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

                if (useFirebase) {
                    this.updatePlayerFirebase();
                } else {
                    this.updatePlayerStorage();
                }
            } catch (error) {
                console.error('GameScene: Error in update:', error);
            }
        }
        updatePlayerFirebase() {
            try {
                this.playersRef.child(this.player.id).set({
                    x: this.player.x,
                    y: this.player.y
                });
                console.log(`GameScene: Updated player ${this.player.id} at (${this.player.x}, ${this.player.y}) in Firebase`);
            } catch (error) {
                console.error('GameScene: Error updating Firebase:', error);
            }
        }
        updatePlayerStorage() {
            try {
                let players = JSON.parse(localStorage.getItem('mafia_players'));
                players[this.player.id] = { x: this.player.x, y: this.player.y };
                localStorage.setItem('mafia_players', JSON.stringify(players));
                console.log(`GameScene: Updated player ${this.player.id} at (${this.player.x}, ${this.player.y}) in localStorage`);
            } catch (error) {
                console.error('Error updating localStorage:', error);
            }
        }
        updateOtherPlayers(players) {
            try {
                for (let id in players) {
                    if (id !== this.player.id) {
                        if (!this.otherPlayers[id]) {
                            this.otherPlayers[id] = this.textures.exists('player')
                                ? this.add.sprite(players[id].x], players[id].y], 'player')
                                : this.add.text(players[id].x], players[id].y], 'P', { fontSize: '16px', color: '#f00' });
                            this.otherPlayers[id].id] = id;
                            console.log(`GameScene: Added player ${id} at (${players[id].x}, ${players[id].y})`);
                        } else {
                            this.otherPlayers[id].setPosition(players[id].x], players[id].y]);
                        }
                    }
                }
                for (let id in of this.otherPlayers) {
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

    // Initialize Phaser
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