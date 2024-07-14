const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load player image
const basketImage = new Image();
basketImage.src = 'yuji.png'; // Replace with your basket image path

// Load bullet image
const bulletImage = new Image();
bulletImage.src = 'orb.png'; // Replace with your bullet image path

const basket = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 100,
    width: 100,
    height: 100,
    dx: 0
};

const items = [];
const maxItems = 5;
const itemRadius = 20;
const itemSpeed = 5;

let score = 0;

// Initialize falling items
for (let i = 0; i < maxItems; i++) {
    items.push({
        x: Math.random() * canvas.width,
        y: 0
    });
}

const bullets = [];
const bulletSpeed = 10;

function drawBasket() {
    ctx.drawImage(basketImage, basket.x, basket.y, basket.width, basket.height);
}

function drawItems() {
    items.forEach(item => {
        ctx.beginPath();
        ctx.arc(item.x, item.y, itemRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();
    });
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.drawImage(bulletImage, bullet.x, bullet.y, 50, 50); // Adjust size as needed
    });
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

function updateItems() {
    items.forEach(item => {
        item.y += itemSpeed;

        if (item.y + itemRadius > canvas.height) {
            item.y = 0;
            item.x = Math.random() * canvas.width;
        }

        bullets.forEach(bullet => {
            if (
                bullet.x > item.x - itemRadius &&
                bullet.x < item.x + itemRadius &&
                bullet.y < item.y + itemRadius &&
                bullet.y > item.y - itemRadius
            ) {
                item.y = 0;
                item.x = Math.random() * canvas.width;
                score++;
                bullet.isHit = true;
            }
        });
    });

    // Remove hit bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i].isHit) {
            bullets.splice(i, 1);
        }
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

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBasket();
    drawItems();
    drawBullets();
    drawScore();

    moveBasket();
    updateItems();
    updateBullets();

    requestAnimationFrame(update);
}

function keyDown(e) {
    if (e.key === 'ArrowRight') {
        basket.dx = 5;
    } else if (e.key === 'ArrowLeft') {
        basket.dx = -5;
    } else if (e.key === ' ') { // Spacebar to shoot
        bullets.push({ x: basket.x + basket.width / 2 - 5, y: basket.y }); // Center the bullet
    }
}

function keyUp(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        basket.dx = 0;
    }
}

basketImage.onload = function() {
    bulletImage.onload = function() {
        update(); // Start the game loop once images are loaded
    };
};

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
