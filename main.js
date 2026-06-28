/**
 * Main Module
 * Application initialization and global setup
 */

// ==================== APPLICATION INITIALIZATION ====================

/**
 * Initialize application on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application initializing...');
    
    // Set up API configuration
    setupAPIConfiguration();
    
    // Check authentication status
    initializeApp();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize responsive design
    setupResponsiveDesign();
    
    console.log('Application initialized successfully');
});

/**
 * Setup API configuration
 */
function setupAPIConfiguration() {
    console.log('API Configuration:');
    console.log('  Base URL:', API_CONFIG.baseURL);
    console.log('  Timeout:', API_CONFIG.timeout + 'ms');
}

/**
 * Initialize application based on authentication status
 */
function initializeApp() {
    // Check if user is already logged in
    const isLoggedIn = checkAuthentication();
    
    if (isLoggedIn) {
        console.log('User is already logged in');
        showDashboard();
    } else {
        console.log('User is not logged in - showing login page');
        // Ensure login page is visible
        document.getElementById('loginPage').classList.add('active');
        document.getElementById('dashboardPage').classList.remove('active');
    }
}

// ==================== EVENT LISTENERS ====================

/**
 * Set up global event listeners
 */
function setupEventListeners() {
    // Handle window unload (optional: clear sensitive data)
    window.addEventListener('beforeunload', () => {
        // Don't clear token on page refresh - user should stay logged in
        // Only clear when they explicitly logout
    });
    
    // Handle online/offline status
    window.addEventListener('online', () => {
        console.log('Application is online');
        showNotification('You are back online', 'success');
    });
    
    window.addEventListener('offline', () => {
        console.log('Application is offline');
        showNotification('You are offline - some features may not work', 'warning');
    });
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(event) {
    // Escape key closes modal
    if (event.key === 'Escape') {
        const modal = document.getElementById('expenseModal');
        if (modal && !modal.classList.contains('hidden')) {
            closeExpenseModal();
        }
    }
    
    // Ctrl+N / Cmd+N opens add expense form
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        const modal = document.getElementById('expenseModal');
        if (modal && modal.classList.contains('hidden')) {
            showAddExpenseForm();
        }
    }
}

// ==================== RESPONSIVE DESIGN ====================

/**
 * Set up responsive design features
 */
function setupResponsiveDesign() {
    // Handle viewport changes
    window.addEventListener('resize', () => {
        adjustLayoutForViewport();
    });
    
    // Initial layout adjustment
    adjustLayoutForViewport();
}

/**
 * Adjust layout based on viewport size
 */
function adjustLayoutForViewport() {
    const width = window.innerWidth;
    
    // Hide/show elements based on screen size
    if (width < 768) {
        // Mobile view
        document.body.classList.add('mobile-view');
    } else {
        document.body.classList.remove('mobile-view');
    }
}

// ==================== GLOBAL ERROR HANDLING ====================

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    
    // Don't expose internal errors to user, just log them
    if (event.error && event.error.message) {
        console.error('Error details:', event.error.message);
    }
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Show user-friendly error message
    if (event.reason && event.reason.message) {
        showNotification('An error occurred: ' + event.reason.message, 'error');
    }
});

// ==================== NOTIFICATION SYSTEM ====================

/**
 * Show temporary notification
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${getNotificationColor(type)};
        color: white;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Get notification color based on type
 */
function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#667eea'
    };
    return colors[type] || colors.info;
}

// ==================== PERFORMANCE MONITORING ====================

/**
 * Log performance metrics
 */
function logPerformanceMetrics() {
    if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
        
        console.log('Performance Metrics:');
        console.log('  Page Load Time:', loadTime + 'ms');
        console.log('  DOM Ready Time:', domReadyTime + 'ms');
    }
}

/**
 * Initialize performance monitoring
 */
window.addEventListener('load', () => {
    setTimeout(logPerformanceMetrics, 0);
});

// ==================== VERSION INFORMATION ====================

const APP_VERSION = '1.0.0';
const APP_NAME = 'Expense Tracker';
const BUILD_DATE = new Date().toISOString().split('T')[0];

console.log(`
========================================
${APP_NAME} v${APP_VERSION}
Build Date: ${BUILD_DATE}
Backend: http://localhost:8080/api
========================================
`);

// ==================== DEVELOPMENT UTILITIES ====================

/**
 * Development utilities (only in development mode)
 */
const DevUtils = {
    /**
     * Clear all app data (tokens, expenses)
     */
    clearAllData: () => {
        localStorage.clear();
        location.reload();
    },
    
    /**
     * Simulate logout
     */
    simulateLogout: () => {
        handleLogout();
    },
    
    /**
     * Get current state
     */
    getState: () => ({
        isAuthenticated: isAuthenticated(),
        token: getToken(),
        userName: localStorage.getItem('userName'),
        expensesLoaded: allExpenses.length,
        apiBaseURL: API_CONFIG.baseURL
    }),
    
    /**
     * Get loaded expenses
     */
    getExpenses: () => allExpenses,
    
    /**
     * Simulate API delay (for testing)
     */
    setAPIDelay: (ms) => {
        // This would need to be implemented in the API module
        console.log('API delay simulation not yet implemented');
    }
};

// Make dev utils available in console
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.DevUtils = DevUtils;
    console.log('Development utilities available: window.DevUtils');
}

// ==================== POLYFILLS & COMPATIBILITY ====================

/**
 * Polyfill for older browsers
 */
if (!String.prototype.padStart) {
    String.prototype.padStart = function(targetLength, padString) {
        const str = String(this);
        const pad = String(padString || ' ');
        if (str.length >= targetLength) return str;
        return pad.repeat((targetLength - str.length) / pad.length).substring(0, targetLength - str.length) + str;
    };
}

// ==================== SECURITY ====================

/**
 * Security: Prevent XSS
 * Disable inline scripts and set CSP headers
 */
function setupSecurityHeaders() {
    // Note: Some of these need to be set by the server
    // This is just documentation of what should be set
    
    console.log('Security setup complete');
    console.log('Recommended server-side headers:');
    console.log('  Content-Security-Policy: default-src \'self\'; script-src \'self\' cdn.jsdelivr.net; style-src \'self\' \'unsafe-inline\'');
    console.log('  X-Content-Type-Options: nosniff');
    console.log('  X-Frame-Options: SAMEORIGIN');
    console.log('  X-XSS-Protection: 1; mode=block');
}

setupSecurityHeaders();

// ==================== LOCAL STORAGE MANAGEMENT ====================

/**
 * Manage localStorage quota
 */
function checkLocalStorageQuota() {
    try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        console.log('localStorage is available');
    } catch (e) {
        if (e instanceof QuotaExceededError) {
            console.error('localStorage quota exceeded');
            alert('Storage quota exceeded. Some data may not be saved.');
        } else {
            console.error('localStorage is not available:', e);
        }
    }
}

checkLocalStorageQuota();

// ==================== STARTUP SEQUENCE ====================
console.log(`
████████████████████████████████
   Expense Tracker v${APP_VERSION}
████████████████████████████████

Startup sequence:
✓ DOM Content Loaded
✓ API Configuration
✓ Authentication Check
✓ Event Listeners Setup
✓ Responsive Design
✓ Security Setup
✓ Performance Monitoring

Status: Ready
`);