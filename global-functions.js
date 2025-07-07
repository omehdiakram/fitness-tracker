// Global Functions - Expose module functions globally for HTML onclick handlers

// Authentication functions
function showLoginForm() {
    auth.showLoginForm();
}

function showRegisterForm() {
    auth.showRegisterForm();
}

function showForgotPasswordForm() {
    auth.showForgotPasswordForm();
}

function loginUser() {
    auth.loginUser();
}

function registerUser() {
    auth.registerUser();
}

function signInWithGoogle() {
    auth.signInWithGoogle();
}

function resetPassword() {
    auth.resetPassword();
}

function signOut() {
    auth.signOut();
}

// UI functions
function showTab(tabName) {
    ui.showTab(tabName);
}

// Dashboard functions
function saveDailyData() {
    dashboard.saveDailyData();
}

function updateDailyMetric(metric, value) {
    dashboard.updateDailyMetric(metric, value);
}

// Chat functions
function sendMessage() {
    chat.sendMessage();
}

// Meal prep functions
function showUploadModal() {
    mealPrep.showUploadModal();
}

function closeUploadModal() {
    mealPrep.closeUploadModal();
}

function uploadFromModal() {
    mealPrep.uploadFromModal();
}

function deleteMealPhoto(timestamp, fileName) {
    mealPrep.deleteMealPhoto(timestamp, fileName);
}

// History functions
function loadDateHistory() {
    history.loadDateHistory();
}

function loadMonthHistory() {
    history.loadMonthHistory();
}

// Utility functions
function showNotification(message, type) {
    ui.showNotification(message, type);
}
