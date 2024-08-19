const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const characters = {
    character1: {
        selectionImg: 'gojo.png',
        fightingImg: 'gojo.png', // Ensure this is the correct fighting image
        width: 100,
        height: 100,
        speed: 7,
        unlocked: true
    },
    character2: {
        selectionImg: 'yuji.png',
        fightingImg: 'yuji.png', // Ensure this is the correct fighting image
        width: 100,
        height: 100,
        speed: 5,
        unlocked: true
    },
    character3: {
        selectionImg: 'yuta.png',
        fightingImg: 'yuta.png', // Ensure this is the correct fighting image
        width: 100,
        height: 100,
        speed: 6,
        unlocked: false
    }
};

let gold = 100;
let selectedCharacter = null;
const bullets = [];
const bulletSpeed = 10;

const player = {
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    img: new Image(),
    speed: 7
};

const enemy = {
    x: 400,
    y: 100,
    width: 100,
    height: 100,
    img: new Image(),
    speed: 3
};

const bulletImage = new Image();
bulletImage.src = 'orb.png';

function initialize() {
    updateShopVisibility();

    document.getElementById('characterSelection').addEventListener('click', function(e) {
        if (e.target.classList.contains('character')) {
            document.querySelectorAll('.character').forEach(char => char.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedCharacter = e.target.getAttribute('data-character');
            console.log('Selected Character:', selectedCharacter);
        }
    });

    document.getElementById('shop').addEventListener('click', function(e) {
        if (e.target.classList.contains('buy-button')) {
            const item = e.target.parentElement;
            const character = item.getAttribute('data-character');
            const price = parseInt(e.target.getAttribute('data-price'), 10);

            if (characters[character] && !characters[character].unlocked) {
                if (gold >= price) {
                    characters[character].unlocked = true;
                    gold -= price;
                    updateShopVisibility();
                    console.log('Bought:', character);
                } else {
                    alert('Not enough gold!');
                }
            }
        }
    });

    document.getElementById('startGame').addEventListener('click', function() {
        if (selectedCharacter && characters[selectedCharacter] && characters[selectedCharacter].unlocked) {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('fightingScreen').style.display = 'flex';
            startGame();
        } else {
            alert('Please select an unlocked character.');
        }
    });

    document.getElementById('restartGame').addEventListener('click', function() {
        document.getElementById('fightingScreen').style.display = 'none';
        document.getElementById('loadingScreen').style.display = 'flex';
        selectedCharacter = null;
        gold = 100;
        bullets.length = 0;
        // Reset other game state if needed
    });
}

function updateShopVisibility() {
    document.querySelectorAll('.shop-item').forEach(item => {
        const character = item.getAttribute('data-character');
        if (characters[character].unlocked) {
            item.querySelector('.buy-button').style.display = 'none';
            item.classList.remove('locked');
        } else {
            item.querySelector('.buy-button').style.display = 'block';
            item.classList.add('locked');
        }
    });
}

function startGame() {
    initializeGame();
    update();
}

function initializeGame() {
    if (selectedCharacter && characters[selectedCharacter]) {
        player.width = characters[selectedCharacter].width;
        player.height = characters[selectedCharacter].height;
        player.img.src = characters[selectedCharacter].fightingImg;
        player.speed = characters[selectedCharacter].speed;

        enemy.img.src = 'curse.png';

        // Center the player and enemy on the canvas
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        player.x = canvas.width / 4 - player.width / 2;
        player.y = canvas.height / 2 - player.height / 2;

        enemy.x = canvas.width * 3 / 4 - enemy.width / 2;
        enemy.y = canvas.height / 2 - enemy.height / 2;
    } else {
        console.error('Selected character is not valid');
    }
}

function drawImage(img, x, y, width, height) {
    ctx.drawImage(img, x, y, width, height);
}

function drawPlayer() {
    drawImage(player.img, player.x, player.y, player.width, player.height);
}

function drawEnemy() {
    drawImage(enemy.img, enemy.x, enemy.y, enemy.width, enemy.height);
}

function drawBullets() {
    bullets.forEach(bullet => {
        drawImage(bulletImage, bullet.x, bullet.y, 50, 50);
    });
}

function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y -= bulletSpeed;
        if (bullet.y < 0) {
            bullets.splice(index, 1);
        }
    });
}

function updateEnemy() {
    if (player.x < enemy.x) enemy.x -= enemy.speed;
    if (player.x > enemy.x) enemy.x += enemy.speed;
    if (player.y < enemy.y) enemy.y -= enemy.speed;
    if (player.y > enemy.y) enemy.y += enemy.speed;

    if (Math.abs(player.x - enemy.x) < 50 && Math.abs(player.y - enemy.y) < 50) {
        console.log('Enemy is close to player');
    }
}

function checkCollisions() {
    bullets.forEach((bullet, index) => {
        if (
            bullet.x < enemy.x + enemy.width &&
            bullet.x + 50 > enemy.x &&
            bullet.y < enemy.y + enemy.height &&
            bullet.y + 50 > enemy.y
        ) {
            console.log('Hit detected');
            bullets.splice(index, 1);
            // Handle enemy hit, e.g., reduce health
        }
    });
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer();
    drawEnemy();
    drawBullets();
    updateBullets();
    updateEnemy();
    checkCollisions();

    requestAnimationFrame(update);
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') player.x += player.speed;
    if (e.key === 'ArrowLeft') player.x -= player.speed;
    if (e.key === 'ArrowUp') player.y -= player.speed;
    if (e.key === 'ArrowDown') player.y += player.speed;
    if (e.key === ' ') {
        bullets.push({
            x: player.x + player.width / 2 - 25,
            y: player.y
        });
    }
});

window.onload = function() {
    initialize();
};
