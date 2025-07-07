// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBYXcm6oJNsTLnRyLB8hv7tmOCX6QOFTyw",
    authDomain: "fitness-tracker-eff06.firebaseapp.com",
    databaseURL: "https://fitness-tracker-eff06-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "fitness-tracker-eff06",
    storageBucket: "fitness-tracker-eff06.firebasestorage.app",
    messagingSenderId: "560968111406",
    appId: "1:560968111406:web:4544427ef3464cde3896bf",
    measurementId: "G-QCVWJM25GF"
};

// Global Firebase variables
window.auth = null;
window.database = null;
window.storage = null;
window.currentUser = null;

// Initialize Firebase
function initializeFirebase() {
    try {
        console.log('🔥 Initializing Firebase...');
        
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            updateFirebaseStatus('error');
            return false;
        }

        // Check if already initialized
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
        
        window.auth = firebase.auth();
        window.database = firebase.database();
        window.storage = firebase.storage();
        
        console.log('✅ Firebase initialized successfully');
        updateFirebaseStatus('connected');
        
        // Set up auth state listener
        window.auth.onAuthStateChanged(handleAuthStateChange);
        
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        updateFirebaseStatus('error');
        // Show notification if ui is available
        if (typeof ui !== 'undefined') {
            ui.showNotification('Firebase initialization failed: ' + error.message, 'error');
        }
        return false;
    }
}

function updateFirebaseStatus(status) {
    const statusElement = document.getElementById('firebaseStatus');
    const statusText = document.getElementById('statusText');
    
    if (!statusElement || !statusText) return;
    
    statusElement.className = 'firebase-status ' + status;
    
    switch (status) {
        case 'connected':
            statusText.textContent = '🔥 Connected';
            break;
        case 'error':
            statusText.textContent = '❌ Error';
            break;
        default:
            statusText.textContent = 'Connecting...';
    }
}

function handleAuthStateChange(user) {
    console.log('🔄 Auth state changed:', user ? 'signed in' : 'signed out');
    
    if (user) {
        window.currentUser = user;
        if (typeof ui !== 'undefined') ui.showMainApp();
        if (typeof dashboard !== 'undefined') {
            dashboard.loadUserData();
            dashboard.loadTodayData();
        }
        updateUserOnlineStatus(true);
        if (typeof chat !== 'undefined') chat.setupChatListener();
        if (typeof history !== 'undefined') history.populateMonthPicker();
    } else {
        window.currentUser = null;
        if (typeof ui !== 'undefined') ui.showAuthScreen();
    }
}

async function updateUserOnlineStatus(isOnline) {
    if (!window.currentUser || !window.database) return;
    
    try {
        await window.database.ref(`users/${window.currentUser.uid}/isOnline`).set(isOnline);
        if (isOnline) {
            await window.database.ref(`users/${window.currentUser.uid}/lastActive`).set(new Date().toISOString());
        }
    } catch (error) {
        console.error('Error updating online status:', error);
    }
}

// Utility function to get error messages
function getFirebaseErrorMessage(error) {
    switch (error.code) {
        case 'auth/user-not-found':
            return 'No account found with this email';
        case 'auth/wrong-password':
            return 'Incorrect password';
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists';
        case 'auth/weak-password':
            return 'Password must be at least 6 characters';
        case 'auth/popup-closed-by-user':
            return 'Google sign-in was cancelled';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later';
        default:
            return error.message || 'An error occurred';
    }
}
