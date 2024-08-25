let selectedCharacter;
let player = { x: 100, y: 100, width: 100, height: 100, img: new Image(), speed: 10 };
let enemy = { x: 300, y: 300, width: 100, height: 100, img: new Image(), speed: 3, health: 100 };
let bullets = [];
const bulletSpeed = 5;
let ctx;
let canvas;
let timer;
let cooldownTimer;
let isAbilityAvailable = true;
let abilityCooldown = 30;
let frameRate = 1000 / 30;
let isLapseBlueActive = false;
const lapseBlueDuration = 5000;
let lapseBlueTimer = 0;
let brightness = 100;
let fps = 30;

const characters = {
    character1: { selectionImg: 'gojo.png', fightingImg: 'gojo2.webp', width: 100, height: 100, speed: 10, unlocked: true },
    character2: { selectionImg: 'yuji.png', fightingImg: 'yuji.png', width: 100, height: 100, speed: 10, unlocked: true },
    character3: { selectionImg: 'yuta.png', fightingImg: 'yuta.png', width: 100, height: 100, speed: 10, unlocked: false },
};

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
}

function update() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(player.img, player.x, player.y, player.width, player.height);
    ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.width, enemy.height);

    bullets.forEach((bullet, index) => {
        ctx.fillStyle = 'white';
        ctx.fillRect(bullet.x, bullet.y, 10, 10);
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(index, 1);
        }
    });

    if (isLapseBlueActive) {
        lapseBlueTimer -= frameRate;
        if (lapseBlueTimer <= 0) {
            isLapseBlueActive = false;
            document.getElementById('lapseBlueEffect').style.display = 'none';
        }
    }

    document.getElementById('timer').textContent = Math.ceil(timer / 1000);
    document.getElementById('cooldown').textContent = `Reversal Red: ${Math.ceil(cooldownTimer / 1000)}s`;

    if (!isAbilityAvailable) {
        cooldownTimer -= frameRate / 1000;
        if (cooldownTimer <= 0) {
            isAbilityAvailable = true;
            document.getElementById('reversalRedButton').disabled = false;
        }
    }

    requestAnimationFrame(update);
}

function startGame() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('fightingScreen').style.display = 'block';
    document.getElementById('background-music').play();

    setupCanvas();
    player.img.src = characters[selectedCharacter].fightingImg;
    enemy.img.src = 'curse.png'; // Updated to use curse.png for the enemy
    timer = 30000; // 30 seconds
    cooldownTimer = abilityCooldown;
    update();
}

function selectCharacter(characterId) {
    if (characters[characterId].unlocked) {
        selectedCharacter = characterId;
        document.querySelectorAll('.character').forEach(el => el.classList.remove('selected'));
        document.querySelector(`img[data-character="${characterId}"]`).classList.add('selected');
    }
}

function buyCharacter(characterId) {
    if (characters[characterId]) {
        characters[characterId].unlocked = true;
        document.querySelector(`.shop-item[data-character="${characterId}"]`).classList.add('available');
    }
}

function handleKeydown(event) {
    const speed = player.speed;
    switch (event.key) {
        case 'w': player.y -= speed; break;
        case 's': player.y += speed; break;
        case 'a': player.x -= speed; break;
        case 'd': player.x += speed; break;
        case ' ':
            if (isAbilityAvailable) {
                bullets.push({
                    x: player.x + player.width / 2,
                    y: player.y + player.height / 2,
                    dx: bulletSpeed,
                    dy: 0
                });
                isAbilityAvailable = false;
                cooldownTimer = abilityCooldown;
                document.getElementById('reversalRedButton').disabled = true;
            }
            break;
        case 'b':
            if (!isLapseBlueActive) {
                isLapseBlueActive = true;
                lapseBlueTimer = lapseBlueDuration;
                document.getElementById('lapseBlueEffect').style.display = 'block';
            }
            break;
    }
}

function updateBrightness(value) {
    brightness = value;
    document.getElementById('brightnessOverlay').style.opacity = value / 100;
}

function updateFPS(value) {
    fps = value;
    frameRate = 1000 / fps;
}

document.getElementById('startGame').addEventListener('click', startGame);
document.getElementById('settingsButton').addEventListener('click', () => {
    document.getElementById('settingsScreen').style.display = 'flex';
    document.getElementById('loadingScreen').style.display = 'none';
});
document.getElementById('backToMenu').addEventListener('click', () => {
    document.getElementById('settingsScreen').style.display = 'none';
    document.getElementById('loadingScreen').style.display = 'flex';
});
document.getElementById('brightness').addEventListener('input', (e) => updateBrightness(e.target.value));
document.getElementById('fps').addEventListener('input', (e) => updateFPS(e.target.value));

document.querySelectorAll('.character').forEach(el => {
    el.addEventListener('click', () => selectCharacter(el.dataset.character));
});
document.querySelectorAll('.buy-button').forEach(button => {
    button.addEventListener('click', () => buyCharacter(button.dataset.character));
});

document.addEventListener('keydown', handleKeydown);
