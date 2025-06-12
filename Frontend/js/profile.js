// Debug function to check elements
function debugElements() {
    console.log('=== DEBUGGING ELEMENTS ===');
    const requiredElements = [
        'currentUsername', 'accountType', 'memberSince',
        'totalScores', 'bestScore', 'unlockedAchievements',
        'recentScores', 'updateProfileForm'
    ];

    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}:`, element ? '✅ FOUND' : '❌ NOT FOUND');
        if (element) {
            console.log(`  - tagName: ${element.tagName}`);
            console.log(`  - className: ${element.className}`);
        }
    });
    console.log('=== END DEBUG ===');
}

document.addEventListener('DOMContentLoaded', async function () {
    console.log('DOM Content Loaded');

    // Debug elements first
    debugElements();

    // Check authentication
    if (!localStorage.getItem('authToken')) {
        alert('Please login first');
        window.location.href = 'index.html';
        return;
    }

    // Wait longer to ensure DOM is fully loaded
    setTimeout(async () => {
        console.log('Starting profile load after timeout...');
        debugElements(); // Check again after timeout
        await loadProfile();
        setupEventListeners();
    }, 500);
});

function setupEventListeners() {
    const updateForm = document.getElementById('updateProfileForm');
    if (updateForm) {
        updateForm.addEventListener('submit', handleUpdateProfile);
        console.log('✅ Event listeners setup');
    } else {
        console.error('❌ Update form not found for event listeners');
    }

    // Real-time password validation
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    if (newPassword && confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordMatch);
        newPassword.addEventListener('input', validatePasswordMatch);
    }
}

async function loadProfile() {
    try {
        console.log('🔄 Loading profile...');
        showLoading(true);

        const profile = await api.getProfile();
        console.log('✅ Profile loaded:', profile);

        displayProfile(profile);
        await loadRecentScores();
        showLoading(false);

    } catch (error) {
        console.error('❌ Failed to load profile:', error);
        showError('Failed to load profile: ' + error.message);
        showLoading(false);
    }
}

function displayProfile(profile) {
    try {
        console.log('📝 Displaying profile data...');

        const currentUsername = document.getElementById('currentUsername');
        if (currentUsername) {
            currentUsername.textContent = profile.username;
            console.log('✅ Set username to:', profile.username);
        } else {
            console.error('❌ currentUsername element not found');
        }

        const accountType = document.getElementById('accountType');
        if (accountType) {
            accountType.textContent = profile.isAdmin ? 'Administrator' : 'Player';
            console.log('✅ Set account type');
        } else {
            console.error('❌ accountType element not found');
        }

        const memberSince = document.getElementById('memberSince');
        if (memberSince) {
            memberSince.textContent = new Date(profile.createdDate).toLocaleDateString();
            console.log('✅ Set member since');
        } else {
            console.error('❌ memberSince element not found');
        }

        const totalScores = document.getElementById('totalScores');
        if (totalScores) {
            totalScores.textContent = profile.totalScores.toString();
            console.log('✅ Set total scores');
        } else {
            console.error('❌ totalScores element not found');
        }

        const bestScore = document.getElementById('bestScore');
        if (bestScore) {
            bestScore.textContent = profile.bestScore.toLocaleString();
            console.log('✅ Set best score');
        } else {
            console.error('❌ bestScore element not found');
        }

        const unlockedAchievements = document.getElementById('unlockedAchievements');
        if (unlockedAchievements) {
            unlockedAchievements.textContent = profile.unlockedAchievements.toString();
            console.log('✅ Set unlocked achievements');
        } else {
            console.error('❌ unlockedAchievements element not found');
        }

        // Set placeholder
        const newUsernameInput = document.getElementById('newUsername');
        if (newUsernameInput) {
            newUsernameInput.placeholder = `Current: ${profile.username}`;
            console.log('✅ Set username placeholder');
        }

        console.log('✅ Profile display completed');

    } catch (error) {
        console.error('❌ Error displaying profile:', error);
        showError('Error displaying profile data');
    }
}

async function loadRecentScores() {
    try {
        console.log('🔄 Loading recent scores...');
        const leaderboard = await api.getLeaderboard();
        const currentUser = localStorage.getItem('username');
        const userScores = leaderboard
            .filter(entry => entry.username === currentUser)
            .slice(0, 5);

        displayRecentScores(userScores);
        console.log('✅ Recent scores loaded');
    } catch (error) {
        console.error('❌ Failed to load recent scores:', error);
        const recentScoresElement = document.getElementById('recentScores');
        if (recentScoresElement) {
            recentScoresElement.innerHTML = '<p class="error-text">Failed to load recent scores</p>';
        }
    }
}

function displayRecentScores(scores) {
    const container = document.getElementById('recentScores');
    if (!container) {
        console.error('❌ Recent scores container not found');
        return;
    }

    if (!scores || scores.length === 0) {
        container.innerHTML = '<p class="no-scores-text">No scores yet. Start playing to see your scores here!</p>';
        return;
    }

    container.innerHTML = scores.map((score, index) => {
        const date = new Date(score.achievedDate).toLocaleDateString();
        return `
            <div class="score-entry">
                <div class="score-rank">#${index + 1}</div>
                <div class="score-points">${score.points.toLocaleString()} pts</div>
                <div class="score-date">${date}</div>
                <button class="delete-score-btn-small" onclick="deleteScore(${score.scoreId}, this)" title="Delete this score">×</button>
            </div>
        `;
    }).join('');
}

async function handleUpdateProfile(e) {
    e.preventDefault();
    console.log('🔄 Handling profile update...');

    const newUsername = document.getElementById('newUsername')?.value.trim();
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    // Validation
    if (!newUsername && !newPassword) {
        showError('Please provide either a new username or password to update.');
        return;
    }

    if (newPassword && newPassword !== confirmPassword) {
        showError('New passwords do not match.');
        return;
    }

    if (newPassword && newPassword.length < 6) {
        showError('New password must be at least 6 characters long.');
        return;
    }

    if (newPassword && !currentPassword) {
        showError('Current password is required to change password.');
        return;
    }

    try {
        const updateBtn = document.querySelector('.update-btn');
        if (updateBtn) {
            updateBtn.disabled = true;
            updateBtn.textContent = 'Updating...';
        }

        const updateData = {};
        if (newUsername) updateData.username = newUsername;
        if (currentPassword) updateData.currentPassword = currentPassword;
        if (newPassword) updateData.newPassword = newPassword;

        await api.updateProfile(updateData);

        // Update localStorage if username changed
        if (newUsername) {
            localStorage.setItem('username', newUsername);
        }

        showSuccess('Profile updated successfully!');

        // Clear form
        const form = document.getElementById('updateProfileForm');
        if (form) {
            form.reset();
        }

        // Reload profile data
        await loadProfile();

    } catch (error) {
        console.error('❌ Failed to update profile:', error);
        showError('Failed to update profile: ' + error.message);
    } finally {
        const updateBtn = document.querySelector('.update-btn');
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.textContent = 'Update Profile';
        }
    }
}

function validatePasswordMatch() {
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    if (!newPassword || !confirmPassword) return;

    const newPasswordValue = newPassword.value;
    const confirmPasswordValue = confirmPassword.value;

    if (newPasswordValue && confirmPasswordValue) {
        if (newPasswordValue === confirmPasswordValue) {
            confirmPassword.style.borderColor = '#27ae60';
            confirmPassword.title = 'Passwords match';
        } else {
            confirmPassword.style.borderColor = '#e74c3c';
            confirmPassword.title = 'Passwords do not match';
        }
    } else {
        confirmPassword.style.borderColor = '';
        confirmPassword.title = '';
    }
}

async function deleteScore(scoreId, buttonElement) {
    const confirmed = await showConfirmDialog(
        'Are you sure you want to delete this score?',
        'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
        buttonElement.disabled = true;
        buttonElement.textContent = '...';

        await api.deleteScore(scoreId);
        showSuccess('Score deleted successfully!');

        await loadProfile();

    } catch (error) {
        console.error('❌ Failed to delete score:', error);
        showError('Failed to delete score: ' + error.message);
        buttonElement.disabled = false;
        buttonElement.textContent = '×';
    }
}

function showLoading(show) {
    if (show) {
        console.log('🔄 Showing loading state');
    } else {
        console.log('✅ Hiding loading state');
    }
}

function showError(message) {
    console.error('❌ Error:', message);
    alert('Error: ' + message); // Simple alert for now
}

function showSuccess(message) {
    console.log('✅ Success:', message);
    alert('Success: ' + message); // Simple alert for now
}

function showConfirmDialog(title, subtitle = '') {
    return Promise.resolve(confirm(title + '\n' + subtitle));
}

function backToGame() {
    window.location.href = 'game.html';
}

function viewAchievements() {
    window.location.href = 'achievements.html';
}

function viewLeaderboard() {
    window.location.href = 'leaderboard.html';
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');
        window.location.href = 'index.html';
    }
}