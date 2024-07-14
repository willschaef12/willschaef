const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const basket = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    width: 100,
    height: 20,
    dx: 0
};

const item = {
    x: Math.random() * canvas.width,
    y: 0,
    radius: 20,
    dy: 5
};

let score = 0;

function drawBasket() {
    ctx.fillStyle = 'white';
    ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
}

function drawItem() {
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.closePath();
}

function drawScore() {
    ctx.fillStyle = 'red';
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

function updateItem() {
    item.y += item.dy ;

    if (item.y + item.radius > canvas.height) {
        item.y = 0;
        item.x = Math.random() * canvas.width;
    }

    if (
        item.y + item.radius > basket.y &&
        item.x > basket.x &&
        item.x < basket.x + basket.width
    ) {
        item.y = 0;
        item.x = Math.random() * canvas.width;
        score++;
    }
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBasket();
    drawItem();
    drawScore();

    moveBasket();
    updateItem();

    requestAnimationFrame(update);
}

function keyDown(e) {
    if (e.key === 'ArrowRight') {
        basket.dx = 5;
    } else if (e.key === 'ArrowLeft') {
        basket.dx = -5;
    }
}

function keyUp(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        basket.dx = 0;
    }
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

update();
