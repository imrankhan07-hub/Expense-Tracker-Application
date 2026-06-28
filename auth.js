/**
 * Authentication Module
 * Handles user login, registration, and logout
 */

window.saveToken = function(token) {
    localStorage.setItem("token", token);
    console.log("Token saved:", token);
}

// ==================== PAGE SWITCHING ====================

/**
 * Toggle between login and register pages
 */
function toggleAuthPage(page) {
    const loginPage = document.getElementById('loginPage');
    const registerPage = document.getElementById('registerPage');
    
    // Clear forms and errors
    clearAuthForms();
    
    if (page === 'login') {
        loginPage.classList.add('active');
        registerPage.classList.remove('active');
    } else if (page === 'register') {
        registerPage.classList.add('active');
        loginPage.classList.remove('active');
    }
}

/**
 * Clear all authentication forms and errors
 */
function clearAuthForms() {
    // Clear forms
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    
    // Clear errors
    clearError('loginError');
    clearError('registerError');
}

// ==================== LOGIN HANDLER ====================

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();
    
    // Clear previous error
    clearError('loginError');
    
    // Get form data
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Validate input
    if (!username || !password) {
        showError('loginError', 'Please enter username and password');
        return false;
    }
    
    try {
        showLoading();
        
        // Call login API
        const response = await AuthAPI.login({
    username,
    password
});

console.log("Login Response:", response);
        
        // Validate response
        if (!response.token) {
            throw new Error('No token received from server');
        }
        
        // Store token and user info
        saveToken(response.token);
        localStorage.setItem('userName', response.username || username);
        
        // Clear forms
        document.getElementById('loginForm').reset();
        
        // Navigate to dashboard
        showDashboard();
        
    } catch (error) {
        console.error('Login error:', error);
        showError('loginError', error.message || 'Login failed. Please try again.');
    } finally {
        hideLoading();
    }
    
    return false;
}

// ==================== REGISTER HANDLER ====================

/**
 * Handle register form submission
 */
async function handleRegister(event) {
    event.preventDefault();
    
    // Clear previous error
    clearError('registerError');
    
    // Get form data
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const fullName = document.getElementById('regFullName').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    // Validate input
    if (!username || !email || !fullName || !password || !confirmPassword) {
        showError('registerError', 'Please fill all fields');
        return false;
    }
    
    // Validate username length
    if (username.length < 3 || username.length > 20) {
        showError('registerError', 'Username must be between 3 and 20 characters');
        return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('registerError', 'Please enter a valid email address');
        return false;
    }
    
    // Validate password length
    if (password.length < 8) {
        showError('registerError', 'Password must be at least 8 characters long');
        return false;
    }
    
    // Validate password requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        showError('registerError', 
            'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)');
        return false;
    }
    
    // Check password match
    if (password !== confirmPassword) {
        showError('registerError', 'Passwords do not match');
        return false;
    }
    
    try {
        showLoading();
        
        // Call register API
        const response = await AuthAPI.register({
            username,
            email,
            fullName,
            password,
            confirmPassword
        });
        
        console.log('Registration successful:', response);
        
        // Show success message
        showError('registerError', 'Registration successful! Logging you in...');
        document.getElementById('registerError').style.color = '#10b981';
        document.getElementById('registerError').style.borderLeftColor = '#10b981';
        document.getElementById('registerError').style.background = '#f0fdf4';
        
        // Auto-login after successful registration
        setTimeout(() => {
            // Switch to login and auto-fill username
            toggleAuthPage('login');
            document.getElementById('loginUsername').value = username;
            document.getElementById('loginPassword').focus();
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showError('registerError', error.message || 'Registration failed. Please try again.');
    } finally {
        hideLoading();
    }
    
    return false;
}

// ==================== LOGOUT HANDLER ====================

/**
 * Handle logout
 */
function handleLogout() {
    // Clear token and user data
    clearToken();
    localStorage.removeItem('userName');
    
    // Hide dashboard, show login
    const dashboardPage = document.getElementById('dashboardPage');
    const loginPage = document.getElementById('loginPage');
    
    dashboardPage.classList.remove('active');
    loginPage.classList.add('active');
    
    // Clear all forms and errors
    clearAuthForms();
    
    // Reset tab selection
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach((btn, index) => {
        if (index === 0) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach((content, index) => {
        if (index === 0) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    console.log('Logged out successfully');
}

// ==================== DASHBOARD INITIALIZATION ====================

/**
 * Show dashboard page
 */
function showDashboard() {
    // Hide auth pages
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('registerPage').classList.remove('active');
    
    // Show dashboard
    document.getElementById('dashboardPage').classList.add('active');
    
    // Update user name in navbar
    const userName = localStorage.getItem('userName');
    const userNameElement = document.getElementById('currentUsername');
    if (userNameElement && userName) {
        userNameElement.textContent = `Hello, ${userName}!`;
    }
    
    // Load dashboard data
    initializeDashboard();
}

/**
 * Check if user is already logged in
 */
function checkAuthentication() {
    if (isAuthenticated()) {
        showDashboard();
        return true;
    }
    return false;
}

// ==================== SESSION MANAGEMENT ====================

/**
 * Set up automatic session check
 * Verify token validity periodically
 */
function setupSessionCheck() {
    // Check session every 5 minutes
    setInterval(() => {
        if (isAuthenticated()) {
            // Token exists, let interceptor handle 401 if it's invalid
            console.log('Session check: Token is valid');
        }
    }, 5 * 60 * 1000);
}

/**
 * Handle 401 Unauthorized responses
 * This is automatically handled by API interceptor
 */
function handle401() {
    console.warn('Unauthorized access - Session expired');
    handleLogout();
}

// ==================== INITIALIZATION ====================

/**
 * Initialize authentication on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    checkAuthentication();
    
    // Set up session management
    setupSessionCheck();
    
    // Set today's date as default in expense form
    const dateInput = document.getElementById('modalDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Format user data for display
 */
function formatUserData(user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || user.full_name,
        isActive: user.isActive || user.is_active
    };
}

/**
 * Validate token format
 */
function isValidToken(token) {
    if (!token) return false;
    
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    try {
        // Try to decode the payload
        const payload = JSON.parse(atob(parts[1]));
        
        // Check if token is expired
        if (payload.exp) {
            const expiryTime = payload.exp * 1000; // Convert to milliseconds
            return Date.now() < expiryTime;
        }
        
        return true;
    } catch (e) {
        console.error('Invalid token format:', e);
        return false;
    }
}

/**
 * Get token expiry time
 */
function getTokenExpiry() {
    const token = getToken();
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp) {
            return new Date(payload.exp * 1000);
        }
    } catch (e) {
        console.error('Error decoding token:', e);
    }
    
    return null;
}
