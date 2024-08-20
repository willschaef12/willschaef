let player = {
  x: 100, y: 100, width: 100, height: 100, img: new Image(), speed: 10
};
let enemy = {
  x: 300, y: 300, width: 100, height: 100, img: new Image(), speed: 3, health: 100
};
const bulletSpeed = 5;
let bullets = [];
let ctx;
let canvas;
let timer;
let cooldownTimer;
let abilityReady = true;
let abilityCooldown = 30;
let redBlastReady = false; // Track if the red blast ability is ready
const redBlastDuration = 500; // Duration of the red blast effect in milliseconds
let frameRate = 1000 / 30; // FPS

document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  initializeEventListeners();
  showLoadingScreen();
  setupSettings();
});

function initializeEventListeners() {
  document.getElementById('startGame').addEventListener('click', () => {
      startGame();
  });

  document.getElementById('abilityButton').addEventListener('click', () => {
      if (abilityReady) {
          useAbility();
      }
  });
}

function showLoadingScreen() {
  document.getElementById('loadingScreen').style.display = 'flex';
  document.getElementById('fightingScreen').style.display = 'none';
}

function startGame() {
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('fightingScreen').style.display = 'flex';
  initializeGame();
}

function initializeGame() {
  player.img.src = 'gojo2.webp';
  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height - player.height - 10;

  enemy.img.src = 'curse.png';
  enemy.x = canvas.width / 2 - enemy.width / 2;
  enemy.y = 10;

  startTimers();
  gameLoop();
}

function startTimers() {
  let timeLeft = 30;
  timer = setInterval(() => {
      timeLeft--;
      document.getElementById('timer').textContent = timeLeft;
      if (timeLeft <= 0) {
          clearInterval(timer);
          activateRedBlast(); // Trigger the red blast ability when the timer hits zero
      }
  }, 1000);

  cooldownTimer = setInterval(() => {
      if (!abilityReady) {
          abilityCooldown--;
          document.getElementById('cooldown').textContent = `Ability Cooldown: ${abilityCooldown}s`;
          if (abilityCooldown <= 0) {
              abilityReady = true;
              document.getElementById('cooldown').textContent = 'Ability Ready!';
              abilityCooldown = 30; // Reset cooldown time for next use
          }
      }
  }, 1000);
}

function useAbility() {
  if (!abilityReady) return;

  abilityReady = false;
  abilityCooldown = 30;
  document.getElementById('cooldown').textContent = `Ability Cooldown: ${abilityCooldown}s`;

  // Example effect: blast effect
  const blast = document.getElementById('blastEffect');
  blast.style.display = 'block';
  blast.style.top = `${player.y + player.height / 2}px`;
  blast.style.left = `${player.x + player.width / 2}px`;
  setTimeout(() => blast.style.display = 'none', 500);
}

function activateRedBlast() {
  // Trigger the red blast effect
  const blast = document.getElementById('blastEffect');
  blast.style.backgroundColor = 'rgba(255, 0, 0, 0.7)'; // Red color
  blast.style.display = 'block';
  blast.style.top = `${player.y + player.height / 2}px`;
  blast.style.left = `${player.x + player.width / 2}px`;

  // Check collision with enemy and apply damage
  if (isColliding(blast, enemy)) {
      enemy.health = 0; // Set enemy health to zero
      removeEnemy(); // Remove enemy from canvas
  }

  setTimeout(() => {
      blast.style.display = 'none';
      redBlastReady = false; // Reset red blast readiness
  }, redBlastDuration);
}

function removeEnemy() {
  enemy.x = -100; // Move enemy out of canvas
  enemy.y = -100;
}

function isColliding(a, b) {
  return !(a.x + a.width < b.x ||
      a.x > b.x + b.width ||
      a.y + a.height < b.y ||
      a.y > b.y + b.height);
}

function gameLoop() {
  setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawPlayer();
      drawEnemy();
      drawBullets();
      gameLoop();
  }, frameRate);
}

function drawPlayer() {
  ctx.drawImage(player.img, player.x, player.y, player.width, player.height);
}

function drawEnemy() {
  if (enemy.health > 0) {
      ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.width, enemy.height);
  }
}

function drawBullets() {
  bullets.forEach(bullet => {
      ctx.drawImage(bullet.img, bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function setupSettings() {
  document.getElementById('brightness').value = brightness;
  document.getElementById('brightnessValue').textContent = brightness;
  document.getElementById('fps').value = fps;
  document.getElementById('fpsValue').textContent = fps;
  document.getElementById('difficulty').value = difficulty;
  document.getElementById('brightnessOverlay').style.opacity = brightness / 100;
}
