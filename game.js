const characters = {
    character1: {
        selectionImg: 'gojo.png',
        fightingImg: 'gojo_fight.png',
        width: 100,
        height: 100,
        speed: 7,
        unlocked: true // Default unlocked character
    },
    character2: {
        selectionImg: 'yuji.png',
        fightingImg: 'yuji_fight.png',
        width: 100,
        height: 100,
        speed: 5,
        unlocked: true // Default unlocked character
    },
    character3: {
        selectionImg: 'yuta.png',
        fightingImg: 'yuta2.png',
        width: 100,
        height: 100,
        speed: 6,
        unlocked: false // Initially locked character
    }
};

function initialize() {
    // Populate the shop based on the unlocked status
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
                if (gold >= price) { // Check if enough gold
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
            document.getElementById('gameCanvas').style.display = 'block';
            startGame();
        } else {
            alert('Please select an unlocked character.');
        }
    });
}

// Function to update the visibility of shop items based on unlocked status
function updateShopVisibility() {
    document.querySelectorAll('.shop-item').forEach(item => {
        const character = item.getAttribute('data-character');
        if (characters[character].unlocked) {
            item.querySelector('.buy-button').style.display = 'none'; // Hide buy button for unlocked characters
            item.classList.remove('locked');
        } else {
            item.querySelector('.buy-button').style.display = 'block'; // Show buy button for locked characters
            item.classList.add('locked');
        }
    });
}

// Initialize game logic
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

        enemy.img.src = 'curse.png'; // Replace with your enemy image
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
        drawImage(document.getElementById('bulletImage'), bullet.x, bullet.y, 50, 50);
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
            bullets.splice(index, 1); // Remove bullet
            // Handle enemy hit
            // For example, you can decrease enemy health here
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

// Control player movement
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') player.x += player.speed;
    if (e.key === 'ArrowLeft') player.x -= player.speed;
    if (e.key === 'ArrowUp') player.y -= player.speed;
    if (e.key === 'ArrowDown') player.y += player.speed;
    if (e.key === ' ') { // Spacebar to shoot
        bullets.push({
            x: player.x + player.width / 2 - 25,
            y: player.y
        });
    }
});

document.addEventListener('keyup', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        player.dx = 0;
    }
});

// Wait for all images to load before starting the game
window.onload = function() {
    initialize();
};
