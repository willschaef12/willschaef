const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Get preloaded images
const basketImage = document.getElementById('basketImage');
const bulletImage = document.getElementById('bulletImage');
const curseImage = document.getElementById('curseImage');

// Load background music
const music = document.getElementById('background-music');

const basket = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 100,
    width: 100,
    height: 100,
    dx: 0
};

const bullets = [];
const bulletSpeed = 10;

// Define the single big enemy with 250 health
const bigEnemy = {
    x: canvas.width / 2 - 50,
    y: 50,
    width: 100,
    height: 100,
    speed: 2,
    health: 250, // Set health to 250
    isHit: false
};

let score = 0;

function drawBasket() {
    ctx.drawImage(basketImage, basket.x, basket.y, basket.width, basket.height);
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.drawImage(bulletImage, bullet.x, bullet.y, 50, 50);
    });
}

function drawHealthBar() {
    const healthBarWidth = 80; // Width of health bar
    const healthBarHeight = 10; // Height of health bar
    const healthPercentage = bigEnemy.health / 250; // Assuming max health is 250

    ctx.fillStyle = 'red'; // Background of health bar
    ctx.fillRect(bigEnemy.x + (bigEnemy.width - healthBarWidth) / 2, bigEnemy.y - 15, healthBarWidth, healthBarHeight);

    ctx.fillStyle = 'green'; // Health portion
    ctx.fillRect(bigEnemy.x + (bigEnemy.width - healthBarWidth) / 2, bigEnemy.y - 15, healthBarWidth * healthPercentage, healthBarHeight);
}

function drawBigEnemy() {
    if (!bigEnemy.isHit) {
        ctx.drawImage(curseImage, bigEnemy.x, bigEnemy.y, bigEnemy.width, bigEnemy.height);
        drawHealthBar(); // Draw the health bar above the enemy
    }
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.fillText('Score: ' + score, 10, 40);
}

function moveBasket() {
    basket.x += basket.dx;

    if (basket.x < 0) {
        basket.x = 0;
    }
    if (basket.x + basket.width > canvas.width) {
        basket.x = canvas.width - basket.width;
    }
}

function updateBullets() {
    bullets.forEach(bullet => {
        bullet.y -= bulletSpeed; // Move bullet up
    });

    // Remove bullets that are out of view
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
}

function updateBigEnemy() {
    if (!bigEnemy.isHit) {
        bigEnemy.y += bigEnemy.speed;

        // Reset position if it goes off screen
        if (bigEnemy.y > canvas.height) {
            bigEnemy.y = 0; // Reset to the top
            bigEnemy.x = Math.random() * (canvas.width - bigEnemy.width); // Random x position
        }

        // Check for collision with bullets
        bullets.forEach(bullet => {
            if (
                bullet.x < bigEnemy.x + bigEnemy.width &&
                bullet.x + 50 > bigEnemy.x &&
                bullet.y < bigEnemy.y + bigEnemy.height &&
                bullet.y + 50 > bigEnemy.y
            ) {
                bigEnemy.health -= 20; // Decrease health by 20
                bullet.isHit = true; // Mark bullet as hit
                
                if (bigEnemy.health <= 0) {
                    bigEnemy.isHit = true; // Mark enemy as hit
                    score += 10; // Increase score
                }
            }
        });
    }
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBasket();
    drawBullets();
    drawBigEnemy(); // Draw the single big enemy
    drawScore();

    moveBasket();
    updateBullets();
    updateBigEnemy(); // Update the single big enemy

    requestAnimationFrame(update);
}

// Start the game and play music
function startGame() {
    music.play().catch(error => {
        console.log("Error playing music:", error);
    });
    update(); // Start the game loop
}

// Wait for all images to load before starting the game
window.onload = function() {
    startGame();
};

document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') {
        basket.dx = 5;
    } else if (e.key === 'ArrowLeft') {
        basket.dx = -5;
    } else if (e.key === ' ') { // Spacebar to shoot
        bullets.push({ x: basket.x + basket.width / 2 - 25, y: basket.y }); // Center the bullet
    }
});

document.addEventListener('keyup', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        basket.dx = 0;
    }
});
