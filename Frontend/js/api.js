const API_BASE_URL = 'http://localhost:5219/api';

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = localStorage.getItem('authToken');

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return await response.text();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // AUTH OPERATIONS
    async login(username, password) {
        return this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async register(username, password, isAdmin = false) {
        return this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, isAdmin })
        });
    }

    // USER PROFILE OPERATIONS (READ & UPDATE)
    async getProfile() {
        return this.makeRequest('/auth/profile', {
            method: 'GET'
        });
    }

    async updateProfile(profileData) {
        return this.makeRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    // GAME/SCORE OPERATIONS
    async submitScore(points) {
        return this.makeRequest('/game/score', {
            method: 'POST',
            body: JSON.stringify({ points })
        });
    }

    async getLeaderboard() {
        return this.makeRequest('/game/leaderboard');
    }

    async deleteScore(scoreId) {
        return this.makeRequest(`/game/score/${scoreId}`, {
            method: 'DELETE'
        });
    }

    async updateScore(scoreId, points) {
        return this.makeRequest(`/game/score/${scoreId}`, {
            method: 'PUT',
            body: JSON.stringify({ points })
        });
    }

    // ACHIEVEMENT OPERATIONS
    async getAchievements() {
        return this.makeRequest('/achievements');
    }

    async checkAchievements(score) {
        return this.makeRequest(`/achievements/check/${score}`, {
            method: 'POST'
        });
    }

    // ADMIN OPERATIONS
    // Achievement Management
    async createAchievement(achievementData) {
        return this.makeRequest('/admin/achievements', {
            method: 'POST',
            body: JSON.stringify(achievementData)
        });
    }

    async updateAchievement(achievementId, achievementData) {
        return this.makeRequest(`/admin/achievements/${achievementId}`, {
            method: 'PUT',
            body: JSON.stringify(achievementData)
        });
    }

    async deleteAchievement(achievementId) {
        return this.makeRequest(`/admin/achievements/${achievementId}`, {
            method: 'DELETE'
        });
    }

    // User Management
    async getAllUsers() {
        return this.makeRequest('/admin/users');
    }

    async updateUser(userId, userData) {
        return this.makeRequest(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(userId) {
        return this.makeRequest(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
    }

    // Admin Score Management
    async deleteAnyScore(scoreId) {
        return this.makeRequest(`/admin/scores/${scoreId}`, {
            method: 'DELETE'
        });
    }
}

const api = new ApiClient();