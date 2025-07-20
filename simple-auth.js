/**
 * Simple Authentication System for Cravax Convertly
 * Handles login/signup without external dependencies
 */

// Simple user authentication functions
const Auth = {
    // Check if user is logged in
    isLoggedIn() {
        return localStorage.getItem('userId') !== null;
    },

    // Get current user ID
    getUserId() {
        return localStorage.getItem('userId');
    },

    // Get current user data
    getUserData() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },

    // Login user (for demo purposes, accept any email/password)
    async login(email, password) {
        try {
            // For demo purposes, create a user ID based on email
            const userId = email.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const userData = {
                id: userId,
                email: email,
                username: email.split('@')[0],
                isPremium: false
            };

            localStorage.setItem('userId', userId);
            localStorage.setItem('userData', JSON.stringify(userData));
            
            return { success: true, user: userData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Logout user
    logout() {
        localStorage.removeItem('userId');
        localStorage.removeItem('userData');
        localStorage.removeItem('pendingDownload');
    },

    // Require login - redirect if not logged in
    requireLogin() {
        if (!this.isLoggedIn()) {
            const returnTo = encodeURIComponent(window.location.href);
            window.location.href = `/login.html?returnTo=${returnTo}`;
            return false;
        }
        return true;
    }
};

// Make Auth available globally
window.Auth = Auth;