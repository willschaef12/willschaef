let selectedAttackImage = 'orb.png'; // Default image
let abilityReady = true;
let abilityCooldown = 0;
let bullets = [];
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const player = { x: 100, y: 100, width: 50, height: 50 };

// Initialize the game
function initializeGame() {
    document.getElementById('imageSelectionScreen').style.display = 'flex'; // Show image selection screen

    initializeEventListeners();
    requestAnimationFrame(gameLoop);
}

// Event listeners
function initializeEventListeners() {
    document.querySelectorAll('.attack-img-option').forEach(img => {
        img.addEventListener('click', (e) => {
            document.querySelectorAll('.attack-img-option').forEach(option => option.classList.remove('selected'));
            e.target.closest('.attack-img-option').classList.add('selected');
            selectedAttackImage = e.target.closest('.attack-img-option').dataset.image;
        });
    });

    document.getElementById('confirmSelection').addEventListener('click', () => {
        document.getElementById('imageSelectionScreen').style.display = 'none'; // Hide image selection screen
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            useAbility(); // Use ability when spacebar is pressed
        }
    });
}

// Create a bullet and add it to the bullets array
function useAbility() {
    if (!abilityReady) return;

    abilityReady = false;
    abilityCooldown = 30;
    document.getElementById('cooldown').textContent = `Ability Cooldown: ${abilityCooldown}s`;

    const bulletImg = new Image();
    bulletImg.src = selectedAttackImage;
    const newBullet = {
        x: player.x + player.width / 2 - 15, // Centering bullet
        y: player.y,
        img: bulletImg,
        speed: 5
    };
    bullets.push(newBullet);

    // Show blast effect (for demonstration)
    const blast = document.getElementById('blastEffect');
    blast.style.display = 'block';
    blast.style.top = `${player.y + player.height / 2}px`;
    blast.style.left = `${player.x + player.width / 2}px`;
    setTimeout(() => blast.style.display = 'none', 500);

    setTimeout(() => {
        abilityReady = true;
        document.getElementById('cooldown').textContent = 'Ability Ready!';
    }, 30000);
}

// Update the game state and render everything
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    // Draw player
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Update and draw bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed; // Move the bullet up
        ctx.drawImage(bullet.img, bullet.x, bullet.y, 30, 30); // Draw the bullet

        // Remove bullets that are out of bounds
        if (bullet.y < 0) {
            bullets.splice(index, 1);
        }
    });

    requestAnimationFrame(gameLoop);
}

// Start the game
initializeGame();
