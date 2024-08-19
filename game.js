let selectedCharacter;
let player = {
  x: 100,
  y: 100,
  width: 100,
  height: 100,
  img: new Image(),
  speed: 7,
};
let enemy = {
  x: 300,
  y: 300,
  width: 100,
  height: 100,
  img: new Image(),
  speed: 3,
};
let bullets = [];
const bulletSpeed = 5;
let ctx;
let canvas; // Declare canvas as a global variable
let timer;
let abilityAvailable = false;

const characters = {
  character1: {
    selectionImg: "gojo.png",
    fightingImg: "gojo2.png",
    width: 100,
    height: 100,
    speed: 7,
    unlocked: true,
  },
  character2: {
    selectionImg: "yuji.png",
    fightingImg: "yuji_fight.png",
    width: 100,
    height: 100,
    speed: 5,
    unlocked: true,
  },
  character3: {
    selectionImg: "yuta.png",
    fightingImg: "yuta_fight.png",
    width: 100,
    height: 100,
    speed: 6,
    unlocked: false,
  },
};

function initialize() {
  document
    .getElementById("characterSelection")
    .addEventListener("click", function (e) {
      if (e.target.classList.contains("character")) {
        document
          .querySelectorAll(".character")
          .forEach((char) => char.classList.remove("selected"));
        e.target.classList.add("selected");
        selectedCharacter = e.target.getAttribute("data-character");
        console.log("Selected Character:", selectedCharacter);
      }
    });

  document.getElementById("shop").addEventListener("click", function (e) {
    if (e.target.classList.contains("buy-button")) {
      const item = e.target.parentElement;
      const character = item.getAttribute("data-character");
      const price = parseInt(e.target.getAttribute("data-price"), 10);

      if (characters[character] && !characters[character].unlocked) {
        if (gold >= price) {
          characters[character].unlocked = true;
          gold -= price;
          updateShopVisibility();
          console.log("Bought:", character);
        } else {
          alert("Not enough gold!");
        }
      }
    }
  });

  document.getElementById("startGame").addEventListener("click", function () {
    if (
      selectedCharacter &&
      characters[selectedCharacter] &&
      characters[selectedCharacter].unlocked
    ) {
      document.getElementById("loadingScreen").style.display = "none";
      document.getElementById("fightingScreen").style.display = "block";
      initializeGame();
      startTimer();
    } else {
      alert("Please select an unlocked character.");
    }
  });

  document
    .getElementById("abilityButton")
    .addEventListener("click", function () {
      if (abilityAvailable) {
        useReversalRed();
      }
    });

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") player.x += player.speed;
    if (e.key === "ArrowLeft") player.x -= player.speed;
    if (e.key === "ArrowUp") player.y -= player.speed;
    if (e.key === "ArrowDown") player.y += player.speed;
    if (e.key === " ") {
      // Spacebar to shoot
      bullets.push({ x: player.x + player.width / 2 - 25, y: player.y });
    }
  });
}

function updateShopVisibility() {
  document.querySelectorAll(".shop-item").forEach((item) => {
    const character = item.getAttribute("data-character");
    if (characters[character].unlocked) {
      item.querySelector(".buy-button").style.display = "none";
      item.classList.remove("locked");
    } else {
      item.querySelector(".buy-button").style.display = "block";
      item.classList.add("locked");
    }
  });
}

function initializeGame() {
  const character = characters[selectedCharacter];
  if (character) {
    player.width = character.width;
    player.height = character.height;
    player.img.src = character.fightingImg;
    enemy.img.src = "curse.png"; // Ensure this path is correct

    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("Canvas context not found");
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    player.x = canvas.width / 4 - player.width / 2;
    player.y = canvas.height / 2 - player.height / 2;

    enemy.x = (canvas.width * 3) / 4 - enemy.width / 2;
    enemy.y = canvas.height / 2 - enemy.height / 2;

    // Ensure the images are loaded before drawing
    player.img.onload = () => {
      drawPlayer();
      update(); // Start the game loop here
    };
    enemy.img.onload = () => drawEnemy();

    if (selectedCharacter === "character1") {
      // Assuming 'character1' is Gojo
      showGojoIntro();
    }
  } else {
    console.error("Selected character is not valid");
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
  bullets.forEach((bullet) => {
    drawImage(
      document.getElementById("bulletImage"),
      bullet.x,
      bullet.y,
      50,
      50
    );
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
    console.log("Enemy is close to player");
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
      console.log("Hit detected");
      bullets.splice(index, 1);
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

function startTimer() {
  let timeLeft = 30;
  const timerElement = document.getElementById("timer");
  timerElement.textContent = timeLeft;

  timer = setInterval(function () {
    timeLeft -= 1;
    timerElement.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      abilityAvailable = true;
      document.getElementById("abilityButton").style.display = "block";
    }
  }, 1000);
}

function showGojoIntro() {
  const introDiv = document.createElement("div");
  introDiv.style.position = "absolute";
  introDiv.style.top = "50%";
  introDiv.style.left = "50%";
  introDiv.style.transform = "translate(-50%, -50%)";
  introDiv.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  introDiv.style.color = "white";
  introDiv.style.padding = "20px";
  introDiv.style.borderRadius = "10px";
  introDiv.style.textAlign = "center";
  introDiv.innerHTML = `
        <img src="gojo.png" alt="Gojo" style="width: 100px; height: 100px; object-fit: cover;">
        <p>Hi, I'm Gojo. It looks like you chose me to fight. I'll be sure to make this a good fight!</p>
    `;
  document.body.appendChild(introDiv);

  setTimeout(() => {
    introDiv.remove();
  }, 5000); // Remove after 5 seconds
}

function useReversalRed() {
  console.log("Reversal Red ability used!");
  // Implement the ability's effect here
}

window.onload = function () {
  initialize();
};
