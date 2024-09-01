let selectedCharacter;
let player = { x: 100, y: 100, width: 100, height: 100, img: new Image(), speed: 10 };
let enemy = { x: 300, y: 300, width: 100, height: 100, img: new Image(), speed: 3, health: 100 };
let bullets = [];
const bulletSpeed = 5;
let ctx;
let canvas;
let timer;
let isAbilityAvailable = true;
let abilityCooldown = 30; // Not used in this version
let frameRate = 1000 / 30;
let isLapseBlueActive = false;
const lapseBlueDuration = 5000;
let lapseBlueTimer = 0;
let brightness = 100;
let fps = 30;

// Character data
const characters = {
    character1: { selectionImg: 'gojo.png', fightingImg: 'gojo2.webp', width: 100, height: 100, speed: 10, unlocked: true },
    character2: { selectionImg: 'yuji.png', fightingImg: 'yuji.png', width: 100, height: 100, speed: 10, unlocked: true },
    character3: { selectionImg: 'yuta.png', fightingImg: 'yuta.png', width: 100, height: 100, speed: 10, unlocked: false }
};

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
    }
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

    requestAnimationFrame(update);
}

function startGame() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('fightingScreen').style.display = 'block';
    document.getElementById('background-music').play();

    setupCanvas();
    player.img.src = characters[selectedCharacter].fightingImg;
    enemy.img.src = 'curse.png';
    timer = 30000;
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

// Function to handle the "Reversal Red" attack
function activateReversalRed() {
    const blastEffect = document.getElementById('blastEffect');
    blastEffect.style.left = `${player.x + player.width / 2}px`;
    blastEffect.style.top = `${player.y + player.height / 2}px`;
    blastEffect.style.display = 'block';

    // Hide the blast effect after a short delay
    setTimeout(() => {
        blastEffect.style.display = 'none';
    }, 1000); // Adjust this duration to fit the effect's visibility duration
}

// Handle keydown events
function handleKeydown(event) {
    const speed = player.speed;
    switch (event.key) {
        case 'w': player.y -= speed; break;
        case 's': player.y += speed; break;
        case 'a': player.x -= speed; break;
        case 'd': player.x += speed; break;
        case 'ArrowUp': player.y -= speed; break;
        case 'ArrowDown': player.y += speed; break;
        case 'ArrowLeft': player.x -= speed; break;
        case 'ArrowRight': player.x += speed; break;
        case ' ':
            if (isAbilityAvailable) {
                bullets.push({
                    x: player.x + player.width / 2,
                    y: player.y + player.height / 2,
                    dx: bulletSpeed,
                    dy: 0
                });
                isAbilityAvailable = false;
                setTimeout(() => {
                    isAbilityAvailable = true;
                }, abilityCooldown * 1000); // Reset ability availability
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
        case 'r':
            activateReversalRed();
            break;
    }
}

// Event listeners
document.getElementById('reversalRedButton').addEventListener('click', activateReversalRed);

document.getElementById('startGame').addEventListener('click', startGame);

document.querySelectorAll('.character').forEach(el => {
    el.addEventListener('click', () => selectCharacter(el.dataset.character));
});

document.querySelectorAll('.buy-button').forEach(button => {
    button.addEventListener('click', () => {
        const characterId = button.parentElement.dataset.character;
        buyCharacter(characterId);
    });
});

document.getElementById('brightness').addEventListener('input', (e) => {
    brightness = e.target.value;
    document.getElementById('brightnessValue').textContent = brightness;
    document.getElementById('brightnessOverlay').style.backgroundColor = `rgba(0, 0, 0, ${(200 - brightness) / 200})`;
});

document.getElementById('fps').addEventListener('input', (e) => {
    fps = e.target.value;
    document.getElementById('fpsValue').textContent = fps;
    frameRate = 1000 / fps;
});

document.getElementById('difficulty').addEventListener('change', (e) => {
    // Handle difficulty change if needed
});

document.addEventListener('keydown', handleKeydown);
