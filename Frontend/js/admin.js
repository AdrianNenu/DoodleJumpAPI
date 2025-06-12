document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication and admin privileges
    if (!localStorage.getItem('authToken')) {
        window.location.href = 'index.html';
        return;
    }

    if (localStorage.getItem('isAdmin') !== 'true') {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'game.html';
        return;
    }

    await loadUsers();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('achievementForm').addEventListener('submit', handleCreateAchievement);
    document.getElementById('editUserForm').addEventListener('submit', handleEditUser);
    document.getElementById('editAchievementForm').addEventListener('submit', handleEditAchievement);
}

// TAB MANAGEMENT
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');

    // Load data for the selected tab
    switch (tabName) {
        case 'users':
            loadUsers();
            break;
        case 'achievements':
            loadAchievements();
            break;
        case 'scores':
            loadScores();
            break;
    }
}

// USER MANAGEMENT
async function loadUsers() {
    try {
        showLoading('usersContent');
        const users = await api.getAllUsers();
        displayUsers(users);
    } catch (error) {
        console.error('Failed to load users:', error);
        showError('Failed to load users');
        document.getElementById('usersContent').innerHTML = '<div class="error-state">Failed to load users</div>';
    }
}

function displayUsers(users) {
    const container = document.getElementById('usersContent');

    if (!users || users.length === 0) {
        container.innerHTML = '<div class="empty-state">No users found</div>';
        return;
    }

    container.innerHTML = users.map(user => {
        const joinDate = new Date(user.createdDate).toLocaleDateString();
        const currentUserId = localStorage.getItem('username');
        const isCurrentUser = user.username === currentUserId;

        return `
            <div class="table-row ${isCurrentUser ? 'current-user' : ''}">
                <span>${user.userID}</span>
                <span>${user.username}${isCurrentUser ? ' (You)' : ''}</span>
                <span class="user-type ${user.isAdmin ? 'admin' : 'player'}">${user.isAdmin ? 'Admin' : 'Player'}</span>
                <span>${joinDate}</span>
                <span>${user.totalScores}</span>
                <span>${user.bestScore.toLocaleString()}</span>
                <span class="actions">
                    <button onclick="editUser(${user.userID}, '${user.username}', ${user.isAdmin})" class="edit-btn" ${isCurrentUser ? 'disabled' : ''}>Edit</button>
                    <button onclick="deleteUser(${user.userID}, '${user.username}')" class="delete-btn" ${isCurrentUser ? 'disabled' : ''}>Delete</button>
                </span>
            </div>
        `;
    }).join('');
}

function editUser(userId, username, isAdmin) {
    document.getElementById('editUserId').value = userId;
    document.getElementById('editUsername').value = username;
    document.getElementById('editIsAdmin').checked = isAdmin;
    document.getElementById('editUserModal').classList.remove('hidden');
}

async function handleEditUser(e) {
    e.preventDefault();

    const userId = document.getElementById('editUserId').value;
    const username = document.getElementById('editUsername').value;
    const isAdmin = document.getElementById('editIsAdmin').checked;

    try {
        await api.updateUser(userId, { username, isAdmin });
        showSuccess('User updated successfully!');
        closeEditUserModal();
        loadUsers();
    } catch (error) {
        console.error('Failed to update user:', error);
        showError('Failed to update user: ' + error.message);
    }
}

async function deleteUser(userId, username) {
    const confirmed = await showConfirmDialog(
        `Delete user "${username}"?`,
        'This will permanently delete the user and all their data.'
    );

    if (!confirmed) return;

    try {
        await api.deleteUser(userId);
        showSuccess('User deleted successfully!');
        loadUsers();
    } catch (error) {
        console.error('Failed to delete user:', error);
        showError('Failed to delete user: ' + error.message);
    }
}

function closeEditUserModal() {
    document.getElementById('editUserModal').classList.add('hidden');
}

// ACHIEVEMENT MANAGEMENT
async function loadAchievements() {
    try {
        showLoading('adminAchievementsGrid');
        const achievements = await api.getAchievements();
        displayAchievementsAdmin(achievements);
    } catch (error) {
        console.error('Failed to load achievements:', error);
        showError('Failed to load achievements');
        document.getElementById('adminAchievementsGrid').innerHTML = '<div class="error-state">Failed to load achievements</div>';
    }
}

function displayAchievementsAdmin(achievements) {
    const container = document.getElementById('adminAchievementsGrid');

    if (!achievements || achievements.length === 0) {
        container.innerHTML = '<div class="empty-state">No achievements found</div>';
        return;
    }

    container.innerHTML = achievements.map(achievement => {
        const icon = getAchievementIcon(achievement.icon);

        return `
            <div class="admin-achievement-card">
                <div class="achievement-icon">${icon}</div>
                <div class="achievement-info">
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
                    <div class="achievement-meta">
                        <span class="required-score">Required: ${achievement.requiredScore.toLocaleString()} pts</span>
                    </div>
                </div>
                <div class="achievement-actions">
                    <button onclick="editAchievement(${achievement.achievementID}, '${achievement.name}', '${achievement.description}', ${achievement.requiredScore}, '${achievement.icon}')" class="edit-btn">Edit</button>
                    <button onclick="deleteAchievement(${achievement.achievementID}, '${achievement.name}')" class="delete-btn">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function getAchievementIcon(iconName) {
    const iconMap = {
        'first-jump': '🐣', 'warming-up': '🔥', 'thousand-club': '💯', 'sky-walker': '🌤️',
        'cloud-surfer': '☁️', 'stratosphere': '🛸', 'space-cadet': '🚀', 'asteroid-hopper': '☄️',
        'galactic-champion': '👽', 'universe-master': '🌌', 'dimensional': '🔮', 'infinity': '♾️'
    };
    return iconMap[iconName] || '🏆';
}

function showCreateAchievementForm() {
    document.getElementById('createAchievementForm').classList.remove('hidden');
    document.getElementById('achievementName').focus();
}

function cancelAchievementForm() {
    document.getElementById('createAchievementForm').classList.add('hidden');
    document.getElementById('achievementForm').reset();
}

async function handleCreateAchievement(e) {
    e.preventDefault();

    const name = document.getElementById('achievementName').value;
    const description = document.getElementById('achievementDescription').value;
    const requiredScore = parseInt(document.getElementById('requiredScore').value);
    const icon = document.getElementById('achievementIcon').value || 'trophy';

    try {
        await api.createAchievement({ name, description, requiredScore, icon });
        showSuccess('Achievement created successfully!');
        cancelAchievementForm();
        loadAchievements();
    } catch (error) {
        console.error('Failed to create achievement:', error);
        showError('Failed to create achievement: ' + error.message);
    }
}

function editAchievement(id, name, description, requiredScore, icon) {
    document.getElementById('editAchievementId').value = id;
    document.getElementById('editAchievementName').value = name;
    document.getElementById('editAchievementDescription').value = description;
    document.getElementById('editRequiredScore').value = requiredScore;
    document.getElementById('editAchievementIcon').value = icon;
    document.getElementById('editAchievementModal').classList.remove('hidden');
}

async function handleEditAchievement(e) {
    e.preventDefault();

    const id = document.getElementById('editAchievementId').value;
    const name = document.getElementById('editAchievementName').value;
    const description = document.getElementById('editAchievementDescription').value;
    const requiredScore = parseInt(document.getElementById('editRequiredScore').value);
    const icon = document.getElementById('editAchievementIcon').value;

    try {
        await api.updateAchievement(id, { name, description, requiredScore, icon });
        showSuccess('Achievement updated successfully!');
        closeEditAchievementModal();
        loadAchievements();
    } catch (error) {
        console.error('Failed to update achievement:', error);
        showError('Failed to update achievement: ' + error.message);
    }
}

async function deleteAchievement(id, name) {
    const confirmed = await showConfirmDialog(
        `Delete achievement "${name}"?`,
        'This will permanently delete the achievement and remove it from all users.'
    );

    if (!confirmed) return;

    try {
        await api.deleteAchievement(id);
        showSuccess('Achievement deleted successfully!');
        loadAchievements();
    } catch (error) {
        console.error('Failed to delete achievement:', error);
        showError('Failed to delete achievement: ' + error.message);
    }
}

function closeEditAchievementModal() {
    document.getElementById('editAchievementModal').classList.add('hidden');
}

// SCORE MANAGEMENT
async function loadScores() {
    try {
        showLoading('scoresContent');
        const scores = await api.getLeaderboard();
        displayScoresAdmin(scores);
    } catch (error) {
        console.error('Failed to load scores:', error);
        showError('Failed to load scores');
        document.getElementById('scoresContent').innerHTML = '<div class="error-state">Failed to load scores</div>';
    }
}

function displayScoresAdmin(scores) {
    const container = document.getElementById('scoresContent');

    if (!scores || scores.length === 0) {
        container.innerHTML = '<div class="empty-state">No scores found</div>';
        return;
    }

    container.innerHTML = scores.map(score => {
        const date = new Date(score.achievedDate).toLocaleDateString();

        return `
            <div class="table-row">
                <span>${score.scoreId}</span>
                <span>${score.username}</span>
                <span>${score.points.toLocaleString()}</span>
                <span>${date}</span>
                <span class="actions">
                    <button onclick="deleteAnyScore(${score.scoreId}, '${score.username}', ${score.points})" class="delete-btn">Delete</button>
                </span>
            </div>
        `;
    }).join('');
}

async function deleteAnyScore(scoreId, username, points) {
    const confirmed = await showConfirmDialog(
        `Delete ${username}'s score of ${points.toLocaleString()} points?`,
        'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
        await api.deleteAnyScore(scoreId);
        showSuccess('Score deleted successfully!');
        loadScores();
    } catch (error) {
        console.error('Failed to delete score:', error);
        showError('Failed to delete score: ' + error.message);
    }
}

// UTILITY FUNCTIONS
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="loading-indicator">
            <div class="loading-spinner"></div>
            <span>Loading...</span>
        </div>
    `;
}

function refreshCurrentTab() {
    const activeTab = document.querySelector('.tab-btn.active').textContent.toLowerCase();
    if (activeTab.includes('user')) loadUsers();
    else if (activeTab.includes('achievement')) loadAchievements();
    else if (activeTab.includes('score')) loadScores();
}

function showSuccess(message) {
    showMessage(message, 'success');
}

function showError(message) {
    showMessage(message, 'error');
}

function showMessage(message, type = 'info', duration = 4000) {
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
        position: fixed; top: 20px; right: 20px; padding: 0; border-radius: 12px; color: white;
        font-weight: 500; z-index: 1000; animation: slideInRight 0.4s ease;
        background: ${getMessageColor(type)}; box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        min-width: 300px; max-width: 400px;
    `;

    const contentStyle = messageDiv.querySelector('.message-content');
    contentStyle.style.cssText = `display: flex; align-items: center; gap: 12px; padding: 16px 20px; position: relative;`;

    const closeBtn = messageDiv.querySelector('.message-close');
    closeBtn.style.cssText = `background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; margin-left: auto; opacity: 0.8;`;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.style.animation = 'slideOutRight 0.4s ease';
            setTimeout(() => messageDiv.remove(), 400);
        }
    }, duration);
}

function getMessageIcon(type) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
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

function showConfirmDialog(title, subtitle = '') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center;`;

        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 400px; text-align: center;">
                <div style="font-size: 3em; margin-bottom: 15px;">⚠️</div>
                <h3 style="margin: 0 0 15px 0; color: #333;">Confirm Action</h3>
                <p style="margin: 0 0 10px 0; color: #555; font-weight: 600;">${title}</p>
                ${subtitle ? `<p style="margin: 0 0 25px 0; color: #777; font-size: 0.9em;">${subtitle}</p>` : ''}
                <div style="display: flex; gap: 15px; justify-content: center; margin-top: 25px;">
                    <button class="cancel-btn" style="padding: 12px 24px; border: none; border-radius: 8px; background: #95a5a6; color: white; font-weight: 600; cursor: pointer;">Cancel</button>
                    <button class="confirm-btn" style="padding: 12px 24px; border: none; border-radius: 8px; background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; font-weight: 600; cursor: pointer;">Confirm</button>
                </div>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        dialog.querySelector('.cancel-btn').onclick = () => { overlay.remove(); resolve(false); };
        dialog.querySelector('.confirm-btn').onclick = () => { overlay.remove(); resolve(true); };
        overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
    });
}

function backToGame() {
    window.location.href = 'game.html';
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}