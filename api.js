/**
 * API Module
 * Handles all HTTP requests with automatic JWT token injection
 * Base URL: http://localhost:8080/api
 */

// ==================== CONFIGURATION ====================

const API_CONFIG = {
    baseURL: 'http://localhost:8080/api',
    timeout: 10000,
};

// ==================== AXIOS INSTANCE ====================

/**
 * Create Axios instance with JWT interceptor
 */
const apiClient = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
}
});

// ==================== INTERCEPTORS ====================

/**
 * Request Interceptor
 * Automatically attach JWT token to every request
 */
apiClient.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('jwtToken');
        
        // Attach token to Authorization header if it exists
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor
 * Handle 401 errors and redirect to login
 */
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized errors
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized - Clearing tokens and redirecting to login');
            
            // Clear authentication data
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userName');
            
            // Redirect to login
            if (typeof handleLogout === 'function') {
                handleLogout();
            } else {
                // Fallback redirect
                window.location.href = window.location.pathname;
                location.reload();
            }
        }
        
        return Promise.reject(error);
    }
);

// ==================== UTILITY FUNCTIONS ====================

/**
 * Extract error message from API response
 */
function getErrorMessage(error) {
    // Check if response has error message
    if (error.response) {
        const data = error.response.data;
        
        // Handle different error response formats
        if (data.message) return data.message;
        if (data.error) return data.error;
        if (data.errors && Array.isArray(data.errors)) {
            return data.errors[0]?.message || data.errors[0];
        }
    }
    
    // Fallback error messages
    if (error.message === 'Network Error') {
        return 'Network error - please check your connection';
    }
    
    return error.message || 'An error occurred';
}

/**
 * Show loading overlay
 */
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Display error message in UI
 */
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 5000);
    }
}

/**
 * Clear error message
 */
function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.add('hidden');
        errorElement.textContent = '';
    }
}

// ==================== AUTH API CALLS ====================

/**
 * Login API Call
 * POST /auth/login
 * 
 * @param {Object} credentials - { username, password }
 * @returns {Promise<Object>} - { token, user }
 */
const AuthAPI = {
    login: async (credentials) => {
        try {
            const response = await apiClient.post('/auth/login', credentials);
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    },

    /**
     * Register API Call
     * POST /auth/register
     * 
     * @param {Object} data - User registration data
     * @returns {Promise<Object>} - Registration response
     */
    register: async (data) => {
        try {
            const response = await apiClient.post('/auth/register', data);
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    },

    /**
     * Get Current User
     * GET /users/me
     * 
     * @returns {Promise<Object>} - Current user info
     */
    getCurrentUser: async () => {
        try {
            const response = await apiClient.get('/users/me');
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    }
};

// ==================== EXPENSE API CALLS ====================

/**
 * Expense API calls
 */
const ExpenseAPI = {
    /**
     * Get all expenses
     * GET /expenses
     * 
     * @param {Object} params - Query parameters { page, size, category, etc }
     * @returns {Promise<Array>} - List of expenses
     */
    getAll: async (params = {}) => {
        try {
            const response = await apiClient.get('/expenses', { params });
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    },

    /**
     * Get single expense
     * GET /expenses/{id}
     * 
     * @param {Number} id - Expense ID
     * @returns {Promise<Object>} - Expense data
     */
    getById: async (id) => {
        try {
            const response = await apiClient.get(`/expenses/${id}`);
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    },

    /**
     * Create new expense
     * POST /expenses
     * 
     * @param {Object} data - Expense data
     * @returns {Promise<Object>} - Created expense
     */
    create: async (data) => {
        try {
            const response = await apiClient.post('/expenses', data);
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    },

    /**
     * Update expense
     * PUT /expenses/{id}
     * 
     * @param {Number} id - Expense ID
     * @param {Object} data - Updated expense data
     * @returns {Promise<Object>} - Updated expense
     */
    update: async (id, data) => {
        try {
            const response = await apiClient.put(`/expenses/${id}`, data);
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    },

    /**
     * Delete expense
     * DELETE /expenses/{id}
     * 
     * @param {Number} id - Expense ID
     * @returns {Promise<void>}
     */
    delete: async (id) => {
        try {
            await apiClient.delete(`/expenses/${id}`);
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    },

    /**
     * Get expense statistics
     * GET /expenses/dashboard/stats
     * 
     * @returns {Promise<Object>} - Statistics data
     */
    getStats: async () => {
        try {
            const response = await apiClient.get('/expenses/dashboard/stats');
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    },

    /**
     * Search/Filter expenses
     * GET /expenses/search
     * 
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} - Filtered expenses
     */
    search: async (filters = {}) => {
        try {
            const response = await apiClient.get('/expenses/search', { params: filters });
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    }
};

// ==================== REPORT API CALLS ====================

/**
 * Report API calls
 */
const ReportAPI = {
    /**
     * Get monthly report
     * GET /reports/monthly
     * 
     * @returns {Promise<Array>} - Monthly data
     */
    getMonthly: async () => {
        try {
            const response = await apiClient.get('/reports/monthly');
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    },

    /**
     * Get category report
     * GET /reports/category
     * 
     * @returns {Promise<Array>} - Category breakdown
     */
    getCategory: async () => {
        try {
            const response = await apiClient.get('/reports/category');
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    },

    /**
     * Get summary report
     * GET /reports/summary
     * 
     * @returns {Promise<Object>} - Summary data
     */
    getSummary: async () => {
        try {
            const response = await apiClient.get('/reports/summary');
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    }
};

// ==================== EXPORT API CALLS ====================

/**
 * Export API calls
 */
const ExportAPI = {
    /**
     * Export to PDF
     * GET /export/pdf
     */
    toPDF: async (params = {}) => {
        try {
            const response = await apiClient.get('/export/pdf', { 
                params,
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    },

    /**
     * Export to DOCX
     * GET /export/docx
     */
    toDOCX: async (params = {}) => {
        try {
            const response = await apiClient.get('/export/docx', { 
                params,
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    },

    /**
     * Export to CSV
     * GET /export/csv
     */
    toCSV: async (params = {}) => {
        try {
            const response = await apiClient.get('/export/csv', { 
                params,
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw {
                message: getErrorMessage(error),
                status: error.response?.status
            };
        }
    }
};

// ==================== TOKEN MANAGEMENT ====================

/**
 * Store JWT token in localStorage
 */
function saveToken(token) {
    localStorage.setItem('jwtToken', token);
}

/**
 * Get JWT token from localStorage
 */
function getToken() {
    return localStorage.getItem('jwtToken');
}

/**
 * Clear JWT token from localStorage
 */
function clearToken() {
    localStorage.removeItem('jwtToken');
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!getToken();
}

// ==================== EXPORTS ====================

// Export API objects for use in other modules
// Usage: AuthAPI.login(), ExpenseAPI.getAll(), etc
