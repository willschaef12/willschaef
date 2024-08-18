let selectedCharacter = '';
const characters = {
    character1: {
        selectionImg: 'gojo.png',     // Image for character selection
        fightingImg: 'gojo2.webp', // Image for fighting screen
        width: 100,
        height: 100,
        speed: 70  // Adjust speed for this character
    },
    character2: {
        selectionImg: 'yuji.png',     // Image for character selection
        fightingImg: 'yuji_fight.png', // Image for fighting screen
        width: 100,
        height: 100,
        speed: 5  // Adjust speed for this character
    }
};

document.getElementById('characterSelection').addEventListener('click', function(e) {
    if (e.target.classList.contains('character')) {
        document.querySelectorAll('.character').forEach(char => char.classList.remove('selected'));
        e.target.classList.add('selected');
        selectedCharacter = e.target.getAttribute('data-character');
        console.log('Selected Character:', selectedCharacter); // Debugging line
    }
});

document.getElementById('startGame').addEventListener('click', function() {
    if (selectedCharacter && characters[selectedCharacter]) {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('gameCanvas').style.display = 'block';
        startGame();
    } else {
        alert('Please select a character first.');
    }
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 100,
    height: 100,
    img: new Image(),
    speed: 5  // Default speed
};

const enemy = {
    x: Math.random() * (canvas.width - 100),
    y: Math.random() * (canvas.height - 100),
    width: 100,
    height: 100,
    speed: 2,
    img: new Image()
};

function initializeGame() {
    if (selectedCharacter && characters[selectedCharacter]) {
        player.width = characters[selectedCharacter].width;
        player.height = characters[selectedCharacter].height;
        player.img.src = characters[selectedCharacter].fightingImg;
        player.speed = characters[selectedCharacter].speed; // Set player speed

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

function updateEnemy() {
    // Simple AI to chase player
    if (player.x < enemy.x) enemy.x -= enemy.speed;
    if (player.x > enemy.x) enemy.x += enemy.speed;
    if (player.y < enemy.y) enemy.y -= enemy.speed;
    if (player.y > enemy.y) enemy.y += enemy.speed;

    // Check for collision or interaction
    if (Math.abs(player.x - enemy.x) < 50 && Math.abs(player.y - enemy.y) < 50) {
        // Collision or interaction logic
        console.log('Enemy is close to player');
    }
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer();
    drawEnemy();
    updateEnemy();

    requestAnimationFrame(update);
}

function startGame() {
    initializeGame();
    update();
}

// Control player movement
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') player.x += player.speed;
    if (e.key === 'ArrowLeft') player.x -= player.speed;
    if (e.key === 'ArrowUp') player.y -= player.speed;
    if (e.key === 'ArrowDown') player.y += player.speed;
});
