document.addEventListener('DOMContentLoaded', async function () {
    if (!localStorage.getItem('authToken')) {
        window.location.href = 'index.html';
        return;
    }

    await loadLeaderboard();
});

async function loadLeaderboard() {
    try {
        showLoading(true);
        const leaderboard = await api.getLeaderboard();
        displayLeaderboard(leaderboard);
        showLoading(false);
    } catch (error) {
        console.error('Failed to load leaderboard:', error);
        showError('Failed to load leaderboard. Please try again.');
        showLoading(false);
    }
}

function displayLeaderboard(data) {
    const container = document.getElementById('leaderboardContent');
    const currentUser = localStorage.getItem('username');

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="no-scores">
                <div class="empty-icon">🏆</div>
                <h3>No scores yet!</h3>
                <p>Be the first to play and set a high score!</p>
                <button onclick="backToGame()" class="play-button">Start Playing</button>
            </div>
        `;
        return;
    }

    container.innerHTML = data.map((entry, index) => {
        const rank = index + 1;
        const date = new Date(entry.achievedDate).toLocaleDateString();
        const isCurrentUser = entry.username === currentUser;

        // Enhanced delete button with better accessibility
        const deleteButton = isCurrentUser ? `
            <button class="delete-score-btn" 
                    onclick="deleteScore(${entry.scoreId}, this)" 
                    title="Delete this score"
                    aria-label="Delete score of ${entry.points.toLocaleString()} points">
                ×
            </button>
        ` : '';

        return `
            <div class="leaderboard-entry ${isCurrentUser ? 'current-user' : ''}" 
                 data-score-id="${entry.scoreId}"
                 data-username="${entry.username}">
                <span class="rank">${getRankEmoji(rank)} ${rank}</span>
                <span class="username">${entry.username}${isCurrentUser ? ' (You)' : ''}</span>
                <span class="score">${entry.points.toLocaleString()}</span>
                <span class="date">${date}</span>
                <span class="actions">${deleteButton}</span>
            </div>
        `;
    }).join('');

    // Add entrance animations
    animateEntries();
}

function animateEntries() {
    const entries = document.querySelectorAll('.leaderboard-entry');
    entries.forEach((entry, index) => {
        entry.style.opacity = '0';
        entry.style.transform = 'translateY(20px)';

        setTimeout(() => {
            entry.style.transition = 'all 0.5s ease';
            entry.style.opacity = '1';
            entry.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

async function deleteScore(scoreId, buttonElement) {
    // Show confirmation dialog with more context
    const entryElement = buttonElement.closest('.leaderboard-entry');
    const username = entryElement.querySelector('.username').textContent.replace(' (You)', '');
    const score = entryElement.querySelector('.score').textContent;

    const confirmed = await showConfirmDialog(
        `Are you sure you want to delete your score of ${score} points?`,
        'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
        // Add loading state
        buttonElement.disabled = true;
        buttonElement.classList.add('loading');
        buttonElement.textContent = '';

        // Add deleting animation to the row
        entryElement.classList.add('deleting');

        await api.deleteScore(scoreId);

        // Show success message
        showSuccess('Score deleted successfully!');

        // Wait for animation to complete before removing
        setTimeout(() => {
            entryElement.remove();
            updateRankings();
        }, 300);

    } catch (error) {
        console.error('Failed to delete score:', error);

        // Revert UI state on error
        buttonElement.disabled = false;
        buttonElement.classList.remove('loading');
        buttonElement.textContent = '×';
        entryElement.classList.remove('deleting');

        // Show error with more specific message
        let errorMessage = 'Failed to delete score';
        if (error.message.includes('not found')) {
            errorMessage = 'Score not found or already deleted';
        } else if (error.message.includes('Forbid')) {
            errorMessage = 'You can only delete your own scores';
        } else if (error.message.includes('Unauthorized')) {
            errorMessage = 'Please log in again to delete scores';
        }

        showError(errorMessage);
    }
}

// Function to update rankings after deletion
function updateRankings() {
    const entries = document.querySelectorAll('.leaderboard-entry');
    entries.forEach((entry, index) => {
        const rankElement = entry.querySelector('.rank');
        const newRank = index + 1;
        rankElement.textContent = `${getRankEmoji(newRank)} ${newRank}`;
    });

    // If no entries left, show empty state
    if (entries.length === 0) {
        displayLeaderboard([]);
    }
}

function getRankEmoji(rank) {
    switch (rank) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return '🏅';
    }
}

function showLoading(show) {
    const container = document.getElementById('leaderboardContent');
    if (show) {
        container.innerHTML = `
            <div class="loading-indicator">
                <div class="loading-spinner"></div>
                <span>Loading leaderboard...</span>
            </div>
        `;
    }
}

function showMessage(message, type = 'info', duration = 4000) {
    // Remove existing messages
    document.querySelectorAll('.notification-message').forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `notification-message ${type}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <span class="message-icon">${getMessageIcon(type)}</span>
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 0;
        border-radius: 12px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.4s ease;
        background: ${getMessageColor(type)};
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        min-width: 300px;
        max-width: 400px;
    `;

    const contentStyle = messageDiv.querySelector('.message-content');
    contentStyle.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        position: relative;
    `;

    const closeBtn = messageDiv.querySelector('.message-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
        opacity: 0.8;
        transition: opacity 0.2s ease;
    `;
    closeBtn.addEventListener('mouseover', () => closeBtn.style.opacity = '1');
    closeBtn.addEventListener('mouseout', () => closeBtn.style.opacity = '0.8');

    // Ensure animation styles exist
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight { 
                from { transform: translateX(100%); opacity: 0; } 
                to { transform: translateX(0); opacity: 1; } 
            }
            @keyframes slideOutRight { 
                from { transform: translateX(0); opacity: 1; } 
                to { transform: translateX(100%); opacity: 0; } 
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(messageDiv);

    // Auto-dismiss
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.style.animation = 'slideOutRight 0.4s ease';
            setTimeout(() => messageDiv.remove(), 400);
        }
    }, duration);
}

function getMessageIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

function getMessageColor(type) {
    const colors = {
        success: 'linear-gradient(135deg, #27ae60, #2ecc71)',
        error: 'linear-gradient(135deg, #e74c3c, #c0392b)',
        warning: 'linear-gradient(135deg, #f39c12, #e67e22)',
        info: 'linear-gradient(135deg, #3498db, #2980b9)'
    };
    return colors[type] || colors.info;
}

function showSuccess(message) {
    showMessage(message, 'success');
}

function showError(message) {
    showMessage(message, 'error');
}

function showWarning(message) {
    showMessage(message, 'warning');
}

// Enhanced confirmation dialog
function showConfirmDialog(title, subtitle = '') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-content">
                <div class="confirm-icon">⚠️</div>
                <h3>Confirm Deletion</h3>
                <p class="confirm-title">${title}</p>
                ${subtitle ? `<p class="confirm-subtitle">${subtitle}</p>` : ''}
                <div class="confirm-buttons">
                    <button class="confirm-btn cancel">Cancel</button>
                    <button class="confirm-btn delete">Delete</button>
                </div>
            </div>
        `;

        dialog.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 0;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease;
            max-width: 400px;
            margin: 20px;
            text-align: center;
        `;

        // Add content styling
        const content = dialog.querySelector('.confirm-content');
        content.style.cssText = `
            padding: 30px;
        `;

        const icon = dialog.querySelector('.confirm-icon');
        icon.style.cssText = `
            font-size: 3em;
            margin-bottom: 15px;
        `;

        const h3 = dialog.querySelector('h3');
        h3.style.cssText = `
            margin: 0 0 15px 0;
            color: #333;
            font-size: 1.5em;
        `;

        const titleP = dialog.querySelector('.confirm-title');
        titleP.style.cssText = `
            margin: 0 0 10px 0;
            color: #555;
            font-weight: 600;
        `;

        const subtitleP = dialog.querySelector('.confirm-subtitle');
        if (subtitleP) {
            subtitleP.style.cssText = `
                margin: 0 0 25px 0;
                color: #777;
                font-size: 0.9em;
            `;
        }

        const buttonsDiv = dialog.querySelector('.confirm-buttons');
        buttonsDiv.style.cssText = `
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 25px;
        `;

        const buttons = dialog.querySelectorAll('.confirm-btn');
        buttons.forEach(btn => {
            btn.style.cssText = `
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
            `;
        });

        const cancelBtn = dialog.querySelector('.cancel');
        cancelBtn.style.cssText += `
            background: #95a5a6;
            color: white;
        `;
        cancelBtn.addEventListener('mouseover', () => {
            cancelBtn.style.background = '#7f8c8d';
            cancelBtn.style.transform = 'translateY(-1px)';
        });
        cancelBtn.addEventListener('mouseout', () => {
            cancelBtn.style.background = '#95a5a6';
            cancelBtn.style.transform = 'translateY(0)';
        });

        const deleteBtn = dialog.querySelector('.delete');
        deleteBtn.style.cssText += `
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
        `;
        deleteBtn.addEventListener('mouseover', () => {
            deleteBtn.style.background = 'linear-gradient(135deg, #c0392b, #a93226)';
            deleteBtn.style.transform = 'translateY(-1px)';
        });
        deleteBtn.addEventListener('mouseout', () => {
            deleteBtn.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
            deleteBtn.style.transform = 'translateY(0)';
        });

        // Ensure animation styles exist
        if (!document.querySelector('#dialog-styles')) {
            const style = document.createElement('style');
            style.id = 'dialog-styles';
            style.textContent = `
                @keyframes fadeIn { 
                    from { opacity: 0; } 
                    to { opacity: 1; } 
                }
                @keyframes slideUp { 
                    from { opacity: 0; transform: translateY(30px) scale(0.9); } 
                    to { opacity: 1; transform: translateY(0) scale(1); } 
                }
            `;
            document.head.appendChild(style);
        }

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Handle buttons
        cancelBtn.onclick = () => {
            overlay.remove();
            resolve(false);
        };

        deleteBtn.onclick = () => {
            overlay.remove();
            resolve(true);
        };

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        };

        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                resolve(false);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    });
}

function refreshLeaderboard() {
    loadLeaderboard();
}

function backToGame() {
    window.location.href = 'game.html';
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
                refreshLeaderboard();
            }
            break;
    }
});

// Auto-refresh when window gets focus
window.addEventListener('focus', function () {
    loadLeaderboard();
});