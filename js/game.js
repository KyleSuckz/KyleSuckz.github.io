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
        this.add.image(400, 300, 'city');
        const player = this.add.sprite(100, 100, 'player');
        const car = this.add.sprite(200, 200, 'car');
        firebase.database().ref('players').on('value', (snapshot) => {
            const players = snapshot.val();
            console.log('Players updated:', players);
        });
    }
    update() {
        // Game loop for real-time updates
    }
}