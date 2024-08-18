const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let selectedCharacter = null;

const basketImage = new Image();
const bulletImage = new Image();
const curseImage = new Image();
const characterImages = {
    character1: new Image(),
    character2: new Image()
};

// Load character images
characterImages.character1.src = 'character1.png';
characterImages.character2.src = 'character2.png';

// Load other images
basketImage.src = 'yuji.png';
bulletImage.src = 'orb.png';
curseImage.src = 'curse.png';

// Load background music
const music = new Audio('background.mp3');
music.loop = true;

const basket = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 100,
    width: 100,
    height: 100,
    dx: 0
};

const bullets = [];
const bulletSize = 50;
const bulletSpeed = 10;

const bigEnemy = {
    x: canvas.width / 2 - 50,
    y: 50,
    width: 100,
    height: 100,
    speed: 2,
    health: 250,
    isHit: false
};

let score = 0;
let wave = 1;
let showWaveMessage = true;

function drawBasket() {
    if (selectedCharacter) {
        ctx.drawImage(characterImages[selectedCharacter], basket.x, basket.y, basket.width, basket.height);
    } else {
        ctx.drawImage(basketImage, basket.x, basket.y, basket.width, basket.height);
    }
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.drawImage(bulletImage, bullet.x, bullet.y, bulletSize, bulletSize);
    });
}

function drawHealthBar() {
    const healthBarWidth = 80;
    const healthBarHeight = 10;
    const healthPercentage = bigEnemy.health / 250;

    ctx.fillStyle = 'red';
    ctx.fillRect(bigEnemy.x + (bigEnemy.width - healthBarWidth) / 2, bigEnemy.y - 15, healthBarWidth, healthBarHeight);

    ctx.fillStyle = 'green';
    ctx.fillRect(bigEnemy.x + (bigEnemy.width - healthBarWidth) / 2, bigEnemy.y - 15, healthBarWidth * healthPercentage, healthBarHeight);
}

function drawBigEnemy() {
    if (!bigEnemy.isHit) {
        ctx.drawImage(curseImage, bigEnemy.x, bigEnemy.y, bigEnemy.width, bigEnemy.height);
        drawHealthBar();
    }
}

function drawWaveMessage() {
    ctx.fillStyle = 'blue';
    ctx.font = '80px sans-serif';
    ctx.fillText('Wave ' + wave, canvas.width / 2 - 200, canvas.height / 2);
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.fillText('Score: ' + score, 10, 40);
}

function moveBasket() {
    basket.x += basket.dx;

    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.width > canvas.width) basket.x = canvas.width - basket.width;
}

function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y -= bulletSpeed;
        if (bullet.y < 0) bullets.splice(index, 1);
    });
}

function updateBigEnemy() {
    if (!bigEnemy.isHit) {
        bigEnemy.y += bigEnemy.speed;

        if (bigEnemy.y > canvas.height) {
            bigEnemy.y = 0;
            bigEnemy.x = Math.random() * (canvas.width - bigEnemy.width);
        }

        bullets.forEach((bullet, index) => {
            if (
                bullet.x < bigEnemy.x + bigEnemy.width &&
                bullet.x + bulletSize > bigEnemy.x &&
                bullet.y < bigEnemy.y + bigEnemy.height &&
                bullet.y + bulletSize > bigEnemy.y
            ) {
                bigEnemy.health -= 20;
                bullets.splice(index, 1);
                if (bigEnemy.health <= 0) {
                    bigEnemy.isHit = true;
                    score += 10;
                }
            }
        });
    }
}

function checkGameOver() {
    if (bigEnemy.y + bigEnemy.height > canvas.height) {
        alert('Game Over! Your score: ' + score);
        document.location.reload();
    }
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showWaveMessage) {
        drawWaveMessage();
    } else {
        drawBasket();
        drawBullets();
        drawBigEnemy();
        drawScore();

        moveBasket();
        updateBullets();
        updateBigEnemy();
        checkGameOver();
    }

    requestAnimationFrame(update);
}

function startGame() {
    music.play().catch(error => {
        console.log("Error playing music:", error);
    });

    setTimeout(() => {
        showWaveMessage = false; 
        update(); 
    }, 3000);
}

// Show loading screen and handle character selection
document.getElementById('characterSelection').addEventListener('click', function(e) {
    if (e.target.classList.contains('character')) {
        document.querySelectorAll('.character').forEach(char => char.classList.remove('selected'));
        e.target.classList.add('selected');
        selectedCharacter = e.target.getAttribute('data-character');
    }
});

document.getElementById('startGame').addEventListener('click', function() {
    if (selectedCharacter) {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('gameCanvas').style.display = 'block';
        startGame();
    } else {
        alert('Please select a character first.');
    }
});
