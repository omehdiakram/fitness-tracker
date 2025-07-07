// Global Functions - Expose module functions globally for HTML onclick handlers

// Wait for modules to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Global functions loaded');
});

// Authentication functions
function showLoginForm() {
    if (window.auth) window.auth.showLoginForm();
}

function showRegisterForm() {
    if (window.auth) window.auth.showRegisterForm();
}

function showForgotPasswordForm() {
    if (window.auth) window.auth.showForgotPasswordForm();
}

function loginUser() {
    if (window.auth) window.auth.loginUser();
}

function registerUser() {
    if (window.auth) window.auth.registerUser();
}

function signInWithGoogle() {
    if (window.auth) window.auth.signInWithGoogle();
}

function resetPassword() {
    if (window.auth) window.auth.resetPassword();
}

function signOut() {
    if (window.auth) window.auth.signOut();
}

// UI functions
function showTab(tabName) {
    if (window.ui) window.ui.showTab(tabName);
}

// Dashboard functions
function saveDailyData() {
    if (window.dashboard) window.dashboard.saveDailyData();
}

function updateDailyMetric(metric, value) {
    if (window.dashboard) window.dashboard.updateDailyMetric(metric, value);
}

// Chat functions
function sendMessage() {
    if (window.chat) window.chat.sendMessage();
}

// Meal prep functions
function showUploadModal() {
    if (window.mealPrep) window.mealPrep.showUploadModal();
}

function closeUploadModal() {
    if (window.mealPrep) window.mealPrep.closeUploadModal();
}

function uploadFromModal() {
    if (window.mealPrep) window.mealPrep.uploadFromModal();
}

function deleteMealPhoto(timestamp, fileName) {
    if (window.mealPrep) window.mealPrep.deleteMealPhoto(timestamp, fileName);
}

// History functions
function loadDateHistory() {
    if (window.history) window.history.loadDateHistory();
}

function loadMonthHistory() {
    if (window.history) window.history.loadMonthHistory();
}

// Utility functions
function showNotification(message, type) {
    if (window.ui) window.ui.showNotification(message, type);
}
