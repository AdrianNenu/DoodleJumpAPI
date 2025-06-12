document.addEventListener('DOMContentLoaded', async function () {
    if (!localStorage.getItem('authToken')) {
        window.location.href = 'index.html';
        return;
    }

    await loadAchievements();
});

function getAchievementIcon(iconName) {
    const iconMap = {
        'first-jump': '🐣',
        'warming-up': '🔥',
        'thousand-club': '💯',
        'sky-walker': '🌤️',
        'cloud-surfer': '☁️',
        'stratosphere': '🛸',
        'space-cadet': '🚀',
        'asteroid-hopper': '☄️',
        'galactic-champion': '👽',
        'universe-master': '🌌',
        'dimensional': '🔮',
        'infinity': '♾️'
    };
    return iconMap[iconName] || '🏆';
}

async function loadAchievements() {
    try {
        showLoading(true);
        const achievements = await api.getAchievements();
        displayAchievements(achievements);
        updateStats(achievements);
        showError('');
    } catch (error) {
        console.error('Failed to load achievements:', error);
        showError('Failed to load achievements. Please try again.');
        displayEmptyState();
    } finally {
        showLoading(false);
    }
}

function displayAchievements(achievements) {
    const container = document.getElementById('achievementsGrid');

    if (!achievements || achievements.length === 0) {
        displayEmptyState();
        return;
    }

    container.innerHTML = achievements.map(achievement => {
        const isUnlocked = achievement.isUnlocked;
        const unlockedDate = achievement.unlockedDate ?
            new Date(achievement.unlockedDate).toLocaleDateString() : '';
        const icon = getAchievementIcon(achievement.icon);

        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon ${isUnlocked ? '' : 'locked-icon'}">
                    ${isUnlocked ? icon : '🔒'}
                </div>
                <div class="achievement-info">
                    <h3 class="achievement-name">
                        ${isUnlocked ? achievement.name : '???'}
                    </h3>
                    <p class="achievement-description">
                        ${isUnlocked ? achievement.description : 'Unlock by reaching ' + achievement.requiredScore.toLocaleString() + ' points!'}
                    </p>
                    <div class="achievement-meta">
                        <span class="required-score">
                            Required: ${achievement.requiredScore.toLocaleString()} pts
                        </span>
                        ${isUnlocked ? `<span class="unlocked-date">Unlocked: ${unlockedDate}</span>` : ''}
                    </div>
                </div>
                ${isUnlocked ? '<div class="achievement-badge">✓</div>' : ''}
            </div>
        `;
    }).join('');

    animateAchievements();
}

function displayEmptyState() {
    const container = document.getElementById('achievementsGrid');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🎮</div>
            <h3>No Achievements Available</h3>
            <p>Start playing to unlock achievements!</p>
            <button onclick="backToGame()" class="play-button">Start Playing</button>
        </div>
    `;
}

function updateStats(achievements) {
    const unlockedCount = achievements.filter(a => a.isUnlocked).length;
    const totalCount = achievements.length;
    const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

    document.getElementById('unlockedCount').textContent = unlockedCount;
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('progressPercent').textContent = progressPercent + '%';

    // Update progress bar if exists
    const progressBar = document.querySelector('.progress-bar-fill');
    if (progressBar) {
        progressBar.style.width = progressPercent + '%';
    }
}

function animateAchievements() {
    const achievements = document.querySelectorAll('.achievement-card');
    achievements.forEach((achievement, index) => {
        achievement.style.opacity = '0';
        achievement.style.transform = 'translateY(20px)';

        setTimeout(() => {
            achievement.style.transition = 'all 0.5s ease';
            achievement.style.opacity = '1';
            achievement.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function showLoading(show) {
    const container = document.getElementById('achievementsGrid');
    if (show) {
        container.innerHTML = `
            <div class="loading-indicator">
                <div class="loading-spinner"></div>
                <span>Loading achievements...</span>
            </div>
        `;
    }
}

function showError(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    if (message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <span class="error-icon">⚠️</span>
            <span>${message}</span>
            <button class="error-close" onclick="this.parentElement.remove()">×</button>
        `;

        const container = document.querySelector('.achievements-container');
        container.insertBefore(errorDiv, container.firstChild);
    }
}

function refreshAchievements() {
    loadAchievements();
}

function backToGame() {
    window.location.href = 'game.html';
}

function viewLeaderboard() {
    window.location.href = 'leaderboard.html';
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    window.location.href = 'index.html';
}

// Add keyboard shortcuts
document.addEventListener('keydown', function (e) {
    switch (e.key) {
        case 'Escape':
            backToGame();
            break;
        case 'r':
        case 'R':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                refreshAchievements();
            }
            break;
    }
});

// Auto-refresh when window gets focus
window.addEventListener('focus', function () {
    loadAchievements();
});