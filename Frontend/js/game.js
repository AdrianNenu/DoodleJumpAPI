class DoodleJumpGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.username = localStorage.getItem('username');
        this.isAdmin = localStorage.getItem('isAdmin') === 'true';

        this.gameRunning = false;
        this.gameOver = false;
        this.paused = false;
        this.score = 0;
        this.lives = this.isAdmin ? Infinity : 3;
        this.maxHeight = 0;
        this.highScore = parseInt(localStorage.getItem('highScore') || '0');

        this.player = { x: 185, y: 400, width: 30, height: 30, velocityX: 0, velocityY: 0, onGround: false, color: this.isAdmin ? '#f39c12' : '#e74c3c', direction: 1 };
        this.platforms = [];
        this.particles = [];
        this.camera = { y: 0 };
        this.keys = {};
        this.lastCheckedScore = 0;

        this.gravity = 0.6;
        this.jumpPower = -16;
        this.moveSpeed = 6;

        this.init();
    }

    init() {
        if (!localStorage.getItem('authToken')) {
            window.location.href = 'index.html';
            return;
        }

        this.setupUI();
        this.setupEvents();
        this.generatePlatforms();
        this.startGame();
    }

    setupUI() {
        document.getElementById('playerName').textContent = `Player: ${this.username}`;
        if (this.isAdmin) {
            document.getElementById('adminBadge').classList.remove('hidden');
            document.getElementById('livesDisplay').textContent = 'Lives: ∞';
        } else {
            document.getElementById('livesDisplay').textContent = `Lives: ${this.lives}`;
        }
        document.getElementById('scoreDisplay').textContent = `Score: 0`;
    }

    setupEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (['arrowleft', 'arrowright', ' ', 'a', 'd'].includes(e.key.toLowerCase())) e.preventDefault();
            if (e.key === ' ' || e.key === 'Escape') this.togglePause();
        });
        document.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        window.addEventListener('blur', () => { if (this.gameRunning && !this.gameOver) { this.paused = true; this.updatePauseButton(); } });
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        let touchStartX = 0;
        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); touchStartX = e.touches[0].clientX; });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const deltaX = e.touches[0].clientX - touchStartX;
            this.keys['a'] = deltaX < -15; this.keys['d'] = deltaX > 15;
        });
        this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); this.keys['a'] = this.keys['d'] = false; });
    }

    generatePlatforms() {
        this.platforms = [{ x: 0, y: 580, width: 400, height: 20, type: 'ground', color: '#8B4513' }];
        let currentY = 580;
        for (let i = 1; i <= 25; i++) {
            currentY -= Math.random() * 70 + 80;
            const width = Math.random() * 40 + 60;
            const type = i > 5 && Math.random() < 0.2 ? 'bouncy' : 'normal';
            this.platforms.push({
                x: Math.random() * (400 - width), y: currentY, width, height: 15,
                type, color: type === 'bouncy' ? '#e74c3c' : '#2ecc71',
                bounceMultiplier: type === 'bouncy' ? 1.5 : 1
            });
        }
    }

    startGame() {
        this.gameRunning = true;
        this.gameLoop();
    }

    gameLoop() {
        if (!this.gameRunning) return;
        if (!this.paused && !this.gameOver) this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        this.handleInput();
        this.updatePlayer();
        this.updateCamera();
        this.updateParticles();
        this.checkCollisions();
        this.generateNewPlatforms();
        this.updateScore();
        this.checkAchievements();
        this.checkGameOver();
    }

    handleInput() {
        this.player.velocityX = 0;
        if (this.keys['a'] || this.keys['arrowleft']) { this.player.velocityX = -this.moveSpeed; this.player.direction = -1; }
        if (this.keys['d'] || this.keys['arrowright']) { this.player.velocityX = this.moveSpeed; this.player.direction = 1; }
        if (this.player.velocityY > 0) this.player.velocityX *= 0.8;
    }

    updatePlayer() {
        this.player.velocityY += this.gravity;
        if (this.player.velocityY > 15) this.player.velocityY = 15;
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;

        if (this.player.x + this.player.width < 0) this.player.x = 400;
        else if (this.player.x > 400) this.player.x = -this.player.width;

        if (this.player.y < this.maxHeight) this.maxHeight = this.player.y;
        this.player.onGround = false;
    }

    updateCamera() {
        const targetY = this.player.y - 250;
        if (targetY < this.camera.y) this.camera.y += (targetY - this.camera.y) * 0.1;
    }

    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.velocityX; p.y += p.velocityY; p.velocityY += 0.2; p.life--;
            return p.life > 0;
        });
    }

    checkCollisions() {
        if (this.player.velocityY > 0) {
            for (const platform of this.platforms) {
                if (this.player.x < platform.x + platform.width && this.player.x + this.player.width > platform.x &&
                    this.player.y + this.player.height > platform.y && this.player.y + this.player.height < platform.y + platform.height + 15) {
                    this.landOnPlatform(platform);
                    break;
                }
            }
        }
    }

    landOnPlatform(platform) {
        this.player.y = platform.y - this.player.height;
        this.player.velocityY = this.jumpPower * (platform.bounceMultiplier || 1);
        this.player.onGround = true;
        this.createJumpParticles(platform);
    }

    createJumpParticles(platform) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2, y: platform.y,
                velocityX: (Math.random() - 0.5) * 4, velocityY: -Math.random() * 3,
                life: 20, color: platform.color
            });
        }
    }

    generateNewPlatforms() {
        this.platforms = this.platforms.filter(p => p.y < this.camera.y + 800);
        let highestPlatform = Math.min(...this.platforms.map(p => p.y));

        while (highestPlatform > this.camera.y - 400) {
            highestPlatform -= Math.random() * 70 + 80;
            const width = Math.random() * 40 + 60;
            const level = Math.floor(Math.abs(highestPlatform) / 100);
            const type = level > 5 && Math.random() < 0.2 ? 'bouncy' : 'normal';
            this.platforms.push({
                x: Math.random() * (400 - width), y: highestPlatform, width, height: 15,
                type, color: type === 'bouncy' ? '#e74c3c' : '#2ecc71',
                bounceMultiplier: type === 'bouncy' ? 1.5 : 1
            });
        }
    }

    updateScore() {
        const heightScore = Math.max(0, Math.floor((580 - this.maxHeight) / 10));
        if (heightScore > this.score) {
            this.score = heightScore;
            document.getElementById('scoreDisplay').textContent = `Score: ${this.score.toLocaleString()}`;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('highScore', this.highScore.toString());
            }
        }
    }

    checkAchievements() {
        if (this.score > this.lastCheckedScore && this.score % 100 === 0) {
            this.lastCheckedScore = this.score;
            this.checkAchievementsAsync();
        }
    }

    async checkAchievementsAsync() {
        try {
            const newAchievements = await api.checkAchievements(this.score);
            if (newAchievements?.length > 0) {
                newAchievements.forEach((achievement, i) => {
                    setTimeout(() => this.showAchievementNotification(achievement), i * 500);
                });
            }
        } catch (error) {
            console.error('Failed to check achievements:', error);
        }
    }

    showAchievementNotification(achievement) {
        const iconMap = { 'first-jump': '🐣', 'warming-up': '🔥', 'thousand-club': '💯', 'sky-walker': '🌤️', 'cloud-surfer': '☁️', 'stratosphere': '🛸', 'space-cadet': '🚀', 'asteroid-hopper': '☄️', 'galactic-champion': '👽', 'universe-master': '🌌', 'dimensional': '🔮', 'infinity': '♾️' };
        const icon = iconMap[achievement.icon] || '🏆';

        const notification = document.createElement('div');
        notification.innerHTML = `<div style="display:flex;align-items:center;gap:12px;position:relative"><span style="font-size:2em">${icon}</span><div><strong>Achievement Unlocked!</strong><div style="font-weight:bold;margin:3px 0">${achievement.achievementName}</div><small>${achievement.description}</small></div><button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:-5px;right:-5px;background:rgba(0,0,0,0.3);border:none;color:white;width:24px;height:24px;border-radius:50%;cursor:pointer">×</button></div>`;
        notification.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#f39c12,#e67e22);color:white;padding:15px;border-radius:12px;box-shadow:0 8px 25px rgba(0,0,0,0.3);z-index:2000;max-width:320px;animation:slideInRight 0.5s ease;font-family:Arial,sans-serif';

        if (!document.querySelector('#achievement-anim')) {
            const style = document.createElement('style');
            style.id = 'achievement-anim';
            style.textContent = '@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideOutRight{from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}';
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.5s ease';
                setTimeout(() => notification.remove(), 500);
            }
        }, 5000);
    }

    checkGameOver() {
        if (this.player.y > this.camera.y + 700) {
            if (!this.isAdmin) {
                this.lives--;
                document.getElementById('livesDisplay').textContent = `Lives: ${this.lives}`;
                if (this.lives <= 0) this.endGame();
                else this.respawnPlayer();
            } else {
                this.respawnPlayer();
            }
        }
    }

    respawnPlayer() {
        const safePlatforms = this.platforms.filter(p => p.y < this.camera.y + 400 && p.y > this.camera.y + 100 && p.type !== 'ground');
        if (safePlatforms.length > 0) {
            const platform = safePlatforms[Math.floor(Math.random() * safePlatforms.length)];
            this.player.x = platform.x + platform.width / 2 - this.player.width / 2;
            this.player.y = platform.y - this.player.height;
            this.player.velocityY = this.player.velocityX = 0;
        }
    }

    endGame() {
        this.gameOver = true;
        this.gameRunning = false;
        this.submitScore();
        this.showGameOverScreen();
    }

    async submitScore() {
        if (this.score === 0) return;
        try {
            await api.submitScore(this.score);
            const newAchievements = await api.checkAchievements(this.score);
            if (newAchievements?.length > 0) {
                setTimeout(() => newAchievements.forEach((a, i) => setTimeout(() => this.showAchievementNotification(a), i * 500)), 1000);
            }
        } catch (error) {
            console.error('Failed to submit score:', error);
        }
    }

    showGameOverScreen() {
        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        const gameOverContent = document.querySelector('.game-over-content');
        const existing = gameOverContent.querySelector('.high-score-display');
        if (existing) existing.remove();

        if (this.score === this.highScore && this.score > 0) {
            const highScore = document.createElement('p');
            highScore.className = 'high-score-display';
            highScore.innerHTML = '🎉 NEW HIGH SCORE! 🎉';
            highScore.style.cssText = 'color:#f39c12;font-weight:bold;margin:10px 0;font-size:1.2em';
            gameOverContent.insertBefore(highScore, gameOverContent.querySelector('button'));
        }

        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    render() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#87CEEB'); gradient.addColorStop(0.7, '#98D8EA'); gradient.addColorStop(1, '#B8E6F1');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, 400, 600);

        this.ctx.save();
        this.ctx.translate(0, -this.camera.y);

        // Draw platforms
        for (const platform of this.platforms) {
            if (platform.y > this.camera.y - 50 && platform.y < this.camera.y + 650) {
                this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
                this.ctx.fillRect(platform.x + 2, platform.y + 2, platform.width, platform.height);
                this.ctx.fillStyle = platform.color;
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                if (platform.type === 'bouncy') {
                    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
                }
            }
        }

        // Draw particles
        for (const particle of this.particles) {
            const alpha = particle.life / 30;
            this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            this.ctx.fillRect(particle.x - 1, particle.y - 1, 3, 3);
        }

        // Draw player
        const x = this.player.x, y = this.player.y + (this.player.onGround ? Math.sin(Date.now() * 0.02) * 2 : 0);
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.ctx.fillRect(x + 2, y + 2, this.player.width, this.player.height);
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(x, y, this.player.width, this.player.height);

        // Eyes
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(x + 6, y + 8, 4, 4);
        this.ctx.fillRect(x + 20, y + 8, 4, 4);
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(x + 7 + this.player.direction, y + 9, 2, 2);
        this.ctx.fillRect(x + 21 + this.player.direction, y + 9, 2, 2);

        // Admin crown
        if (this.isAdmin) {
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.fillRect(x + 5, y - 10, 20, 8);
            this.ctx.fillRect(x + 10, y - 15, 10, 8);
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillRect(x + 13, y - 16, 2, 2);
            this.ctx.fillRect(x + 17, y - 16, 2, 2);
        }

        this.ctx.restore();

        // Draw UI
        const height = Math.max(0, Math.floor((580 - this.player.y) / 10));
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(10, 10, 120, 25);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Height: ${height}m`, 15, 28);

        if (this.highScore > 0) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(10, 40, 150, 25);
            this.ctx.fillStyle = '#f39c12';
            this.ctx.fillText(`Best: ${this.highScore.toLocaleString()}`, 15, 58);
        }

        if (this.paused && !this.gameOver) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, 400, 600);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', 200, 280);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press SPACE to resume', 200, 320);
            this.ctx.textAlign = 'left';
        }
    }

    togglePause() {
        if (!this.gameOver && this.gameRunning) {
            this.paused = !this.paused;
            this.updatePauseButton();
        }
    }

    updatePauseButton() {
        document.getElementById('pauseBtn').textContent = this.paused ? 'Resume' : 'Pause';
    }

    restart() {
        this.gameOver = this.paused = false;
        this.score = this.maxHeight = this.lastCheckedScore = 0;
        this.lives = this.isAdmin ? Infinity : 3;
        this.camera.y = 0;
        this.particles = [];

        this.player = { x: 185, y: 400, width: 30, height: 30, velocityX: 0, velocityY: 0, onGround: false, color: this.isAdmin ? '#f39c12' : '#e74c3c', direction: 1 };
        this.platforms = [];
        this.generatePlatforms();
        this.setupUI();
        this.updatePauseButton();
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.querySelectorAll('.achievement-notification').forEach(n => n.remove());

        this.gameRunning = true;
        this.gameLoop();
    }
}

let game;

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('authToken')) { window.location.href = 'index.html'; return; }
    try { game = new DoodleJumpGame(); } catch (error) { console.error('Game init failed:', error); alert('Game failed to load. Refresh page.'); }
});

function restartGame() { if (game) game.restart(); }
function viewLeaderboard() { window.location.href = 'leaderboard.html'; }
function viewAchievements() { window.location.href = 'achievements.html'; }
function logout() { localStorage.clear(); window.location.href = 'index.html'; }

document.addEventListener('visibilitychange', () => {
    if (game && game.gameRunning && !game.gameOver && document.hidden) {
        game.paused = true; game.updatePauseButton();
    }
});

function viewProfile() {
    window.location.href = 'profile.html';
}

function viewAdmin() {
    if (localStorage.getItem('isAdmin') === 'true') {
        window.location.href = 'admin.html';
    } else {
        alert('Access denied. Admin privileges required.');
    }
}

// Show admin button if user is admin
document.addEventListener('DOMContentLoaded', function () {
    if (localStorage.getItem('isAdmin') === 'true') {
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.classList.remove('hidden');
        }
    }
});