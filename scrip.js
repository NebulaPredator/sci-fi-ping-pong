const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// --- Constants ---
const PADDLE_WIDTH = 18;
const PADDLE_HEIGHT = 115;
const BALL_RADIUS = 14;
const PLAYER_X = 40;
const AI_X = canvas.width - PLAYER_X - PADDLE_WIDTH;
const AI_SPEED = 6.5;

// --- Game State ---
let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
let aiY = (canvas.height - PADDLE_HEIGHT) / 2;
let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 6 * (Math.random() < 0.5 ? 1 : -1),
    vy: (Math.random() - 0.5) * 8
};
let playerScore = 0;
let aiScore = 0;

// --- UI Elements ---
function createButton(text, id, onClick, x, y) {
    let btn = document.createElement("button");
    btn.textContent = text;
    btn.id = id;
    btn.className = "sci-fi-btn";
    btn.style.position = "absolute";
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    btn.onclick = onClick;
    document.body.appendChild(btn);
    return btn;
}

function updateButtonPositions() {
    const canvasRect = canvas.getBoundingClientRect();
    const btnW = 120, btnH = 50;
    if (document.getElementById("restartBtn")) {
        document.getElementById("restartBtn").style.left = `${canvasRect.left + canvas.width/2 - btnW/2}px`;
        document.getElementById("restartBtn").style.top = `${canvasRect.top + canvas.height + 24}px`;
    }
}

// --- Mouse control for player paddle ---
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    let mouseY = e.clientY - rect.top;
    playerY = mouseY - PADDLE_HEIGHT / 2;
    if (playerY < 0) playerY = 0;
    if (playerY > canvas.height - PADDLE_HEIGHT) playerY = canvas.height - PADDLE_HEIGHT;
});

// --- Sci-Fi Neon Paddle ---
function drawNeonRect(x, y, w, h, glowColor, borderColor, fillColor) {
    // Shadow
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 40;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = glowColor;
    ctx.fillRect(x-8, y+8, w+16, h+10);
    ctx.restore();

    // Paddle
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 24;
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3.2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    // Edge highlight
    let grad = ctx.createLinearGradient(x, y, x+w, y+h);
    grad.addColorStop(0, "#fff8");
    grad.addColorStop(1, glowColor + "b0");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.strokeRect(x+2, y+2, w-4, h-4);
    ctx.restore();
}

// --- Sci-Fi Neon Ball ---
function drawNeonBall(x, y, r, glowColor, gradColors) {
    // Ball shadow
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 40;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.arc(x+3, y+9, r+9, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = glowColor;
    ctx.fill();
    ctx.restore();

    // Ball
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 32;
    let grad = ctx.createRadialGradient(x, y, 3, x, y, r);
    grad.addColorStop(0, gradColors[0]);
    grad.addColorStop(0.85, gradColors[1]);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// --- Sci-Fi Grid Background ---
function drawBackgroundGrid() {
    ctx.save();
    ctx.globalAlpha = 0.21;
    let gridSpacing = 36;
    ctx.strokeStyle = "#00fff7";
    ctx.lineWidth = 1.25;
    for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    // Glowing circuit pulse
    let t = Date.now() * 0.0025 % canvas.width;
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = "#0ff";
    ctx.beginPath();
    ctx.moveTo(t, 0);
    ctx.lineTo(t, canvas.height);
    ctx.stroke();
    ctx.restore();

    ctx.globalAlpha = 1.0;
    ctx.restore();
}

// --- Sci-Fi Center Line ---
function drawCenterLine() {
    ctx.save();
    ctx.setLineDash([14, 22]);
    ctx.strokeStyle = "#8d41ff";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#8d41ff";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

// --- Ball Reset ---
function resetBall(scoredLeft) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    let dir = scoredLeft ? 1 : -1;
    ball.vx = (6 + Math.random() * 2) * dir;
    ball.vy = (Math.random() - 0.5) * 10;
}

// --- Ball & Paddle Physics ---
function updateBall() {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top and bottom collision
    if (ball.y - BALL_RADIUS < 0) {
        ball.y = BALL_RADIUS;
        ball.vy *= -1;
    }
    if (ball.y + BALL_RADIUS > canvas.height) {
        ball.y = canvas.height - BALL_RADIUS;
        ball.vy *= -1;
    }

    // Left paddle collision
    if (
        ball.x - BALL_RADIUS < PLAYER_X + PADDLE_WIDTH &&
        ball.x - BALL_RADIUS > PLAYER_X &&
        ball.y > playerY &&
        ball.y < playerY + PADDLE_HEIGHT
    ) {
        ball.x = PLAYER_X + PADDLE_WIDTH + BALL_RADIUS;
        ball.vx *= -1.12;
        ball.vy += ((ball.y - (playerY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2)) * 5;
    }

    // Right paddle collision
    if (
        ball.x + BALL_RADIUS > AI_X &&
        ball.x + BALL_RADIUS < AI_X + PADDLE_WIDTH * 2 &&
        ball.y > aiY &&
        ball.y < aiY + PADDLE_HEIGHT
    ) {
        ball.x = AI_X - BALL_RADIUS;
        ball.vx *= -1.12;
        ball.vy += ((ball.y - (aiY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2)) * 5;
    }

    // Left/right wall collision (score/reset)
    if (ball.x - BALL_RADIUS < 0) {
        aiScore++;
        updateScore();
        resetBall(true);
        showRestartButton();
    }
    if (ball.x + BALL_RADIUS > canvas.width) {
        playerScore++;
        updateScore();
        resetBall(false);
        showRestartButton();
    }
}

// --- AI Paddle Logic ---
function updateAI() {
    // Futuristic AI: predictive but not perfect
    let aiCenter = aiY + PADDLE_HEIGHT / 2;
    let target = ball.y + (Math.random() - 0.5) * 50;
    if (aiCenter < target - 12) {
        aiY += AI_SPEED;
    } else if (aiCenter > target + 12) {
        aiY -= AI_SPEED;
    }
    if (aiY < 0) aiY = 0;
    if (aiY > canvas.height - PADDLE_HEIGHT) aiY = canvas.height - PADDLE_HEIGHT;
}

// --- Drawing Everything ---
function draw() {
    // Clear background and draw grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackgroundGrid();
    drawCenterLine();

    // Draw paddles (neon + shadow)
    drawNeonRect(PLAYER_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT, "#00fff7", "#fff", "#0ff1");
    drawNeonRect(AI_X, aiY, PADDLE_WIDTH, PADDLE_HEIGHT, "#8d41ff", "#fff", "#8d41ff11");

    // Sci-fi paddle details
    for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.strokeStyle = "#00fff7";
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.moveTo(PLAYER_X + 3 + (i * 3), playerY + 16);
        ctx.lineTo(PLAYER_X + 3 + (i * 3), playerY + PADDLE_HEIGHT - 16);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = "#8d41ff";
        ctx.globalAlpha = 0.14;
        ctx.beginPath();
        ctx.moveTo(AI_X + 3 + (i * 3), aiY + 16);
        ctx.lineTo(AI_X + 3 + (i * 3), aiY + PADDLE_HEIGHT - 16);
        ctx.stroke();
        ctx.restore();
    }

    // Ball (glowing neon + shadow)
    drawNeonBall(ball.x, ball.y, BALL_RADIUS, "#fff", ["#fff", "#00fff7"]);

    // Ball trail
    for (let i = 1; i < 8; i++) {
        let scale = 1 - i * 0.13;
        let alpha = 0.22 - i * 0.025;
        ctx.save();
        ctx.globalAlpha = alpha;
        drawNeonBall(ball.x - ball.vx * i * 2, ball.y - ball.vy * i * 2, BALL_RADIUS * scale, "#00fff7", ["#00fff7", "#8d41ff"]);
        ctx.restore();
    }
}

// --- Score HUD ---
function updateScore() {
    document.getElementById("playerScore").textContent = playerScore.toString().padStart(2, "0");
    document.getElementById("aiScore").textContent = aiScore.toString().padStart(2, "0");
}

// --- Restart Button ---
function showRestartButton() {
    if (!document.getElementById("restartBtn")) {
        const canvasRect = canvas.getBoundingClientRect();
        const btn = createButton("Restart", "restartBtn",
            () => {
                playerScore = 0;
                aiScore = 0;
                updateScore();
                resetBall(true);
                btn.remove();
            },
            canvasRect.left + canvas.width/2 - 60,
            canvasRect.top + canvas.height + 24
        );
        updateButtonPositions();
    }
}

// --- Responsive button positioning ---
window.addEventListener('resize', updateButtonPositions);

// --- Main Game Loop ---
function gameLoop() {
    updateBall();
    updateAI();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- Initializations ---
updateScore();
gameLoop();

// --- Sci-Fi Button Styles ---
(function injectSciFiButtonStyles() {
    if (document.getElementById("sci-fi-btn-style")) return;
    const style = document.createElement("style");
    style.id = "sci-fi-btn-style";
    style.textContent = `
    .sci-fi-btn {
        font-family: 'Orbitron', Arial, sans-serif;
        font-size: 1.25rem;
        background: linear-gradient(90deg, #111a, #00fff75e 60%, #8d41ffcc 100%);
        color: #fff;
        border: 2.5px solid #00fff7;
        border-radius: 12px;
        box-shadow:
            0 0 16px #00fff7cc,
            0 0 48px #8d41ff77,
            0 4px 32px #222b;
        letter-spacing: 2px;
        text-shadow: 0 0 6px #00fff7, 0 0 2px #fff;
        padding: 12px 30px;
        cursor: pointer;
        transition: all 0.21s cubic-bezier(.4,2,.4,1);
        outline: none;
        margin-top: 16px;
        z-index: 1000;
    }
    .sci-fi-btn:hover, .sci-fi-btn:focus {
        background: linear-gradient(90deg, #8d41ff 0%, #00fff7 100%);
        color: #222;
        border-color: #8d41ff;
        box-shadow:
            0 0 22px #8d41ffc8,
            0 0 48px #00fff7cc,
            0 8px 32px #111b;
        transform: scale(1.07) rotate(-1deg);
    }
    `;
    document.head.appendChild(style);
})();