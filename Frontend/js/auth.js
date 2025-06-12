document.addEventListener('DOMContentLoaded', function () {
    if (localStorage.getItem('authToken')) {
        window.location.href = 'game.html';
        return;
    }
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await api.login(username, password);

        localStorage.setItem('authToken', response.token);
        localStorage.setItem('username', response.username);
        localStorage.setItem('isAdmin', response.isAdmin);

        window.location.href = 'game.html';
    } catch (error) {
        showError('Login failed: ' + error.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const isAdmin = document.getElementById('isAdminCheck').checked;

    try {
        await api.register(username, password, isAdmin);
        showError('Registration successful! You can now login.', 'success');
        showLogin();
    } catch (error) {
        showError('Registration failed: ' + error.message);
    }
}

function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    clearError();
}

function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    clearError();
}

function showError(message, type = 'error') {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.className = 'error-message ' + (type === 'success' ? 'success' : 'error');
}

function clearError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = '';
    errorDiv.className = 'error-message';
}