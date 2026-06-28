/**
 * Expenses Module
 * Handles expense CRUD operations, filtering, and statistics
 */

// ==================== STATE MANAGEMENT ====================

let allExpenses = [];
let filteredExpenses = [];
let currentEditingId = null;

// ==================== DASHBOARD INITIALIZATION ====================

/**
 * Initialize dashboard with data from backend
 */
async function initializeDashboard() {
    try {
        showLoading();
        
        // Load expenses and stats
        await Promise.all([
            loadExpensesForDashboard(),
            loadDashboardStats(),
            loadAnalyticsData()
        ]);
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showError('expensesError', 'Failed to load dashboard data');
    } finally {
        hideLoading();
    }
}

// ==================== EXPENSE LOADING ====================

/**
 * Load all expenses from backend
 */
async function loadExpensesForDashboard() {
    try {
        // Get all expenses from API
        const expenses = await ExpenseAPI.getAll();
        
        // Store expenses in memory (only during session)
        if (Array.isArray(expenses)) {
            allExpenses = expenses;
            filteredExpenses = [...expenses];
        } else if (expenses.content && Array.isArray(expenses.content)) {
            // If API returns paginated response
            allExpenses = expenses.content;
            filteredExpenses = [...expenses.content];
        }
        
        // Display recent expenses
        displayRecentExpenses(allExpenses.slice(0, 5));
        
        // Display all expenses in expenses tab
        displayAllExpenses(allExpenses);
        
        return allExpenses;
        
    } catch (error) {
        console.error('Error loading expenses:', error);
        throw error;
    }
}

/**
 * Display recent expenses in dashboard
 */
function displayRecentExpenses(expenses) {
    const container = document.getElementById('recentExpensesList');
    
    if (!expenses || expenses.length === 0) {
        container.innerHTML = '<p class="loading">No expenses yet. Add one to get started!</p>';
        return;
    }
    
    const html = expenses.map(expense => `
        <div class="expense-item">
            <div class="expense-info">
                <div class="expense-description">${escapeHtml(expense.description || 'Untitled')}</div>
                <div class="expense-meta">
                    <span>${expense.category || 'Uncategorized'}</span> • 
                    <span>${expense.paymentMethod || 'Unknown'}</span> • 
                    <span>${formatDate(expense.expenseDate)}</span>
                </div>
            </div>
            <div class="expense-amount">₹${formatAmount(expense.amount)}</div>
            <div class="expense-actions">
                <button class="btn btn-secondary" onclick="editExpense(${expense.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteExpense(${expense.id})">Delete</button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

/**
 * Display all expenses in table format
 */
function displayAllExpenses(expenses) {
    const container = document.getElementById('allExpensesList');
    
    if (!expenses || expenses.length === 0) {
        container.innerHTML = '<p class="loading">No expenses found. Add one to get started!</p>';
        return;
    }
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Payment Method</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${expenses.map(expense => `
                    <tr>
                        <td>${escapeHtml(expense.description || 'Untitled')}</td>
                        <td>${expense.category || 'Uncategorized'}</td>
                        <td>${expense.paymentMethod || 'Unknown'}</td>
                        <td>${formatDate(expense.expenseDate)}</td>
                        <td><strong>₹${formatAmount(expense.amount)}</strong></td>
                        <td>
                            <button class="btn btn-secondary" onclick="editExpense(${expense.id})">Edit</button>
                            <button class="btn btn-danger" onclick="deleteExpense(${expense.id})">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// ==================== DASHBOARD STATISTICS ====================

/**
 * Load and display dashboard statistics
 */
async function loadDashboardStats() {
    try {
        // Calculate stats from loaded expenses
        if (allExpenses.length === 0) {
            updateStatsUI({
                total: 0,
                count: 0,
                average: 0,
                max: 0
            });
            return;
        }
        
        const total = allExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        const count = allExpenses.length;
        const average = count > 0 ? total / count : 0;
        const max = Math.max(...allExpenses.map(e => e.amount || 0));
        
        updateStatsUI({
            total,
            count,
            average,
            max
        });
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Update statistics display
 */
function updateStatsUI(stats) {
    document.getElementById('totalExpenses').textContent = `₹${formatAmount(stats.total)}`;
    document.getElementById('expenseCount').textContent = stats.count;
    document.getElementById('avgExpense').textContent = `₹${formatAmount(stats.average)}`;
    document.getElementById('maxExpense').textContent = `₹${formatAmount(stats.max)}`;
}

// ==================== QUICK ADD EXPENSE ====================

/**
 * Handle quick add expense form
 */
async function handleQuickAdd(event) {
    event.preventDefault();
    
    const description = document.getElementById('quickDescription').value.trim();
    const amount = parseFloat(document.getElementById('quickAmount').value);
    const category = document.getElementById('quickCategory').value;
    const paymentMethod = document.getElementById('quickPayment').value;
    
    // Validate input
    if (!description || !amount || !category || !paymentMethod) {
        alert('Please fill all fields');
        return false;
    }
    
    if (amount <= 0) {
        alert('Amount must be greater than 0');
        return false;
    }
    
    try {
        showLoading();
        
        // Create expense via API
        const newExpense = await ExpenseAPI.create({
            description,
            amount,
            category,
            paymentMethod,
            expenseDate: new Date().toISOString().split('T')[0],
            notes: ''
        });
        
        // Add to local list
        allExpenses.unshift(newExpense);
        filteredExpenses = [...allExpenses];
        
        // Refresh displays
        displayRecentExpenses(allExpenses.slice(0, 5));
        displayAllExpenses(allExpenses);
        await loadDashboardStats();
        
        // Clear form
        event.target.reset();
        
        alert('Expense added successfully!');
        
    } catch (error) {
        console.error('Error adding expense:', error);
        alert('Failed to add expense: ' + (error.message || 'Unknown error'));
    } finally {
        hideLoading();
    }
    
    return false;
}

// ==================== MODAL MANAGEMENT ====================

/**
 * Show add expense modal
 */
function showAddExpenseForm() {
    currentEditingId = null;
    
    // Reset form
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Expense';
    clearError('modalError');
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('modalDate').value = today;
    
    // Show modal
    document.getElementById('expenseModal').classList.remove('hidden');
}

/**
 * Close expense modal
 */
function closeExpenseModal() {
    document.getElementById('expenseModal').classList.add('hidden');
    document.getElementById('expenseForm').reset();
    currentEditingId = null;
}

// ==================== EDIT EXPENSE ====================

/**
 * Load expense for editing
 */
async function editExpense(id) {
    try {
        // Find expense from local list
        const expense = allExpenses.find(e => e.id === id);
        
        if (!expense) {
            alert('Expense not found');
            return;
        }
        
        // Populate form
        currentEditingId = id;
        document.getElementById('expenseId').value = id;
        document.getElementById('modalDescription').value = expense.description || '';
        document.getElementById('modalAmount').value = expense.amount || '';
        document.getElementById('modalCategory').value = expense.category || '';
        document.getElementById('modalPayment').value = expense.paymentMethod || '';
        document.getElementById('modalDate').value = expense.expenseDate || '';
        document.getElementById('modalNotes').value = expense.notes || '';
        
        // Update modal title
        document.getElementById('modalTitle').textContent = 'Edit Expense';
        clearError('modalError');
        
        // Show modal
        document.getElementById('expenseModal').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading expense:', error);
        alert('Failed to load expense');
    }
}

/**
 * Save expense (create or update)
 */
async function handleSaveExpense(event) {
    event.preventDefault();
    
    const expenseId = document.getElementById('expenseId').value;
    const description = document.getElementById('modalDescription').value.trim();
    const amount = parseFloat(document.getElementById('modalAmount').value);
    const category = document.getElementById('modalCategory').value;
    const paymentMethod = document.getElementById('modalPayment').value;
    const expenseDate = document.getElementById('modalDate').value;
    const notes = document.getElementById('modalNotes').value.trim();
    
    // Validate input
    if (!description || !amount || !category || !paymentMethod || !expenseDate) {
        showError('modalError', 'Please fill all required fields');
        return false;
    }
    
    if (amount <= 0) {
        showError('modalError', 'Amount must be greater than 0');
        return false;
    }
    
    try {
        showLoading();
        
        const expenseData = {
            description,
            amount,
            category,
            paymentMethod,
            expenseDate,
            notes
        };
        
        if (expenseId) {
            // Update existing expense
            const updated = await ExpenseAPI.update(parseInt(expenseId), expenseData);
            
            // Update local list
            const index = allExpenses.findIndex(e => e.id === parseInt(expenseId));
            if (index !== -1) {
                allExpenses[index] = updated;
            }
            
            alert('Expense updated successfully!');
        } else {
            // Create new expense
            const created = await ExpenseAPI.create(expenseData);
            
            // Add to local list
            allExpenses.unshift(created);
        }
        
        // Refresh displays
        filteredExpenses = [...allExpenses];
        displayRecentExpenses(allExpenses.slice(0, 5));
        displayAllExpenses(allExpenses);
        await loadDashboardStats();
        
        // Close modal
        closeExpenseModal();
        
    } catch (error) {
        console.error('Error saving expense:', error);
        showError('modalError', 'Failed to save expense: ' + (error.message || 'Unknown error'));
    } finally {
        hideLoading();
    }
    
    return false;
}

// ==================== DELETE EXPENSE ====================

/**
 * Delete expense with confirmation
 */
async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        showLoading();
        
        // Delete via API
        await ExpenseAPI.delete(id);
        
        // Remove from local list
        allExpenses = allExpenses.filter(e => e.id !== id);
        filteredExpenses = allExpenses.filter(e => e.id !== id);
        
        // Refresh displays
        displayRecentExpenses(allExpenses.slice(0, 5));
        displayAllExpenses(allExpenses);
        await loadDashboardStats();
        
        alert('Expense deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense: ' + (error.message || 'Unknown error'));
    } finally {
        hideLoading();
    }
}

// ==================== FILTERING ====================

/**
 * Filter expenses by category
 */
function filterExpenses() {
    const category = document.getElementById('filterCategory').value;
    
    if (!category) {
        filteredExpenses = [...allExpenses];
    } else {
        filteredExpenses = allExpenses.filter(e => e.category === category);
    }
    
    displayAllExpenses(filteredExpenses);
}

/**
 * Reset all filters
 */
function resetFilters() {
    document.getElementById('filterCategory').value = '';
    filteredExpenses = [...allExpenses];
    displayAllExpenses(allExpenses);
}

// ==================== ANALYTICS & CHARTS ====================

let categoryChart = null;
let paymentChart = null;
let trendChart = null;

/**
 * Load and display analytics data
 */
async function loadAnalyticsData() {
    try {
        // Calculate category breakdown
        const categoryData = calculateCategoryBreakdown(allExpenses);
        displayCategoryChart(categoryData);
        
        // Calculate payment method breakdown
        const paymentData = calculatePaymentBreakdown(allExpenses);
        displayPaymentChart(paymentData);
        
        // Calculate monthly trend
        const trendData = calculateMonthlyTrend(allExpenses);
        displayTrendChart(trendData);
        
        // Display monthly summary
        displayMonthlySummary(trendData);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

/**
 * Calculate category breakdown
 */
function calculateCategoryBreakdown(expenses) {
    const breakdown = {};
    
    expenses.forEach(expense => {
        const category = expense.category || 'Uncategorized';
        breakdown[category] = (breakdown[category] || 0) + expense.amount;
    });
    
    return breakdown;
}

/**
 * Display category chart
 */
function displayCategoryChart(categoryData) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = generateColors(labels.length);
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Calculate payment method breakdown
 */
function calculatePaymentBreakdown(expenses) {
    const breakdown = {};
    
    expenses.forEach(expense => {
        const method = expense.paymentMethod || 'Unknown';
        breakdown[method] = (breakdown[method] || 0) + expense.amount;
    });
    
    return breakdown;
}

/**
 * Display payment method chart
 */
function displayPaymentChart(paymentData) {
    const ctx = document.getElementById('paymentChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (paymentChart) {
        paymentChart.destroy();
    }
    
    const labels = Object.keys(paymentData);
    const data = Object.values(paymentData);
    const colors = generateColors(labels.length);
    
    paymentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Amount (₹)',
                data: data,
                backgroundColor: colors,
                borderColor: 'rgba(102, 126, 234, 0.5)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Calculate monthly trend
 */
function calculateMonthlyTrend(expenses) {
    const monthlyData = {};
    
    expenses.forEach(expense => {
        const date = new Date(expense.expenseDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + expense.amount;
    });
    
    return monthlyData;
}

/**
 * Display trend chart
 */
function displayTrendChart(trendData) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (trendChart) {
        trendChart.destroy();
    }
    
    const labels = Object.keys(trendData).sort();
    const data = labels.map(label => trendData[label]);
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Expenses (₹)',
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Display monthly summary
 */
function displayMonthlySummary(monthlyData) {
    const container = document.getElementById('monthlySummary');
    
    const months = Object.keys(monthlyData).sort().reverse();
    
    if (months.length === 0) {
        container.innerHTML = '<p class="loading">No data available</p>';
        return;
    }
    
    const html = months.map(month => {
        const amount = monthlyData[month];
        return `
            <div class="summary-item">
                <span class="summary-label">${month}</span>
                <span class="summary-value">₹${formatAmount(amount)}</span>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// ==================== TAB SWITCHING ====================

/**
 * Switch between dashboard tabs
 */
function switchTab(tabName) {
    // Update tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    const activeTab = document.getElementById(tabName + 'Tab');
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Load analytics data when switching to analytics tab
    if (tabName === 'analytics') {
        loadAnalyticsData();
    }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format amount with proper decimal places
 */
function formatAmount(amount) {
    if (!amount) return '0.00';
    return parseFloat(amount).toFixed(2);
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Generate colors for charts
 */
function generateColors(count) {
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe',
        '#43e97b', '#fa7231', '#feca57', '#48dbfb',
        '#ff6b6b', '#ee5a6f', '#c06c84', '#6c5b7b'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}
