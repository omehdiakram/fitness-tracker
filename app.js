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

// Global variables
let auth = null;
let database = null;
let storage = null;
let currentUser = null;
let userData = {};
let dailyData = {};
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = new Date().toDateString();
let historyData = {};
let typingTimeout = null;

// Initialize Firebase
function initializeFirebase() {
    try {
        console.log('🔥 Initializing Firebase...');
        
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK not loaded');
        }

        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        database = firebase.database();
        storage = firebase.storage();
        
        console.log('✅ Firebase initialized successfully');
        updateFirebaseStatus('connected');
        
        auth.onAuthStateChanged(handleAuthStateChange);
        
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        updateFirebaseStatus('error');
        showNotification('Firebase initialization failed: ' + error.message, 'error');
        return false;
    }
}

function updateFirebaseStatus(status) {
    const statusElement = document.getElementById('firebaseStatus');
    const statusText = document.getElementById('statusText');
    
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

// Authentication Functions
function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
}

function showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

function showResetPassword() {
    document.getElementById('resetModal').classList.add('active');
}

function closeResetModal() {
    document.getElementById('resetModal').classList.remove('active');
}

async function sendPasswordReset() {
    const email = document.getElementById('resetEmail').value.trim();
    if (!email) {
        showNotification('Please enter your email address.', 'error');
        return;
    }
    if (!auth) {
        showNotification('Firebase not initialized. Please refresh the page.', 'error');
        return;
    }
    try {
        await auth.sendPasswordResetEmail(email);
        showNotification('Password reset email sent! Check your inbox.', 'success');
        closeResetModal();
    } catch (error) {
        console.error('Password reset error:', error);
        showNotification(getErrorMessage(error), 'error');
    }
}

async function loginUser() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (!auth) {
        showNotification('Firebase not initialized. Please refresh the page.', 'error');
        return;
    }

    try {
        console.log('🔑 Attempting login...');
        await auth.signInWithEmailAndPassword(email, password);
        showNotification('Welcome back! 🎉', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showNotification(getErrorMessage(error), 'error');
    }
}

async function registerUser() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const nickname = document.getElementById('registerNickname').value.trim();
    
    if (!name || !email || !password || !nickname) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    if (!auth || !database) {
        showNotification('Firebase not initialized. Please refresh the page.', 'error');
        return;
    }

    try {
        console.log('📝 Creating account...');
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await user.updateProfile({ displayName: name });
        
        const initialUserData = {
            uid: user.uid,
            name: name,
            nickname: nickname,
            email: email,
            score: 0,
            streak: 0,
            joinDate: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            isOnline: true,
            dailyMetrics: {},
            mealPhotos: {}
        };
        
        await database.ref(`users/${user.uid}`).set(initialUserData);
        showNotification('Account created successfully! 🎉', 'success');
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification(getErrorMessage(error), 'error');
    }
}

async function signInWithGoogle() {
    if (!auth) {
        showNotification('Firebase not initialized. Please refresh the page.', 'error');
        return;
    }

    try {
        console.log('🔍 Google sign-in...');
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
        
        if (!userSnapshot.exists()) {
            const nickname = prompt('Enter your squad nickname:') || 'Challenger';
            
            const initialUserData = {
                uid: user.uid,
                name: user.displayName,
                nickname: nickname,
                email: user.email,
                photoURL: user.photoURL,
                score: 0,
                streak: 0,
                joinDate: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                isOnline: true,
                dailyMetrics: {},
                mealPhotos: {}
            };
            
            await database.ref(`users/${user.uid}`).set(initialUserData);
        }
        
        showNotification('Welcome to الأبطال! 🎉', 'success');
        
    } catch (error) {
        console.error('Google sign-in error:', error);
        showNotification('Google sign-in failed: ' + getErrorMessage(error), 'error');
    }
}

async function signOut() {
    if (!auth) return;
    
    try {
        if (currentUser) {
            await database.ref(`users/${currentUser.uid}/isOnline`).set(false);
        }
        await auth.signOut();
        showNotification('Signed out successfully', 'success');
    } catch (error) {
        console.error('Sign out error:', error);
        showNotification('Error signing out', 'error');
    }
}

function handleAuthStateChange(user) {
    console.log('🔄 Auth state changed:', user ? 'signed in' : 'signed out');
    
    if (user) {
        currentUser = user;
        showMainApp();
        loadUserData();
        loadTodayData();
        updateUserOnlineStatus(true);
        setupChatListener();
    } else {
        currentUser = null;
        showAuthScreen();
    }
}

function showAuthScreen() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    updateTodayDate();
}

// User Data Functions
async function loadUserData() {
    if (!currentUser || !database) return;
    
    try {
        const snapshot = await database.ref(`users/${currentUser.uid}`).once('value');
        if (snapshot.exists()) {
            userData = snapshot.val();
            updateUserInterface();
            // If height is present, update profile
            if (userData.height) {
                document.getElementById('profileHeight').value = userData.height;
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function updateUserInterface() {
    document.getElementById('userName').textContent = userData.name || 'User';
    document.getElementById('userAvatar').textContent = (userData.name || 'U').charAt(0).toUpperCase();
    document.getElementById('totalScore').textContent = userData.score || 0;
    document.getElementById('weeklyStreak').textContent = userData.streak || 0;
    updateStreakIndicator();
}

function updateStreakIndicator() {
    const streak = userData.streak || 0;
    document.getElementById('streakCount').textContent = streak;
    
    if (streak >= 7) {
        document.getElementById('streakIndicator').style.background = 'rgba(245, 158, 11, 0.1)';
        document.getElementById('streakIndicator').style.color = '#f59e0b';
    }
}

async function updateUserOnlineStatus(isOnline) {
    if (!currentUser || !database) return;
    
    try {
        await database.ref(`users/${currentUser.uid}/isOnline`).set(isOnline);
        if (isOnline) {
            await database.ref(`users/${currentUser.uid}/lastActive`).set(new Date().toISOString());
        }
    } catch (error) {
        console.error('Error updating online status:', error);
    }
}

// Daily Metrics Functions
function updateTodayDate() {
    const today = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('todayDate').textContent = today.toLocaleDateString('en-US', options);
}

async function loadTodayData() {
    if (!currentUser || !database) return;
    
    const today = new Date().toDateString();
    
    try {
        const snapshot = await database.ref(`users/${currentUser.uid}/dailyMetrics/${today}`).once('value');
        if (snapshot.exists()) {
            dailyData = snapshot.val();
            updateDailyInterface();
        } else {
            dailyData = {};
        }
    } catch (error) {
        console.error('Error loading today data:', error);
    }
}

function updateDailyInterface() {
    document.getElementById('weightInput').value = dailyData.weight || '';
    document.getElementById('cardioInput').value = dailyData.cardio || '';
    document.getElementById('proteinInput').value = dailyData.protein || '';
    document.getElementById('waterInput').value = dailyData.water || '';
    document.getElementById('sleepInput').value = dailyData.sleep || '';
    document.getElementById('trainingCheck').checked = dailyData.training || false;
    document.getElementById('mealprepCheck').checked = dailyData.mealprep || false;
    document.getElementById('moodInput').value = dailyData.mood || '';
    document.getElementById('carbsInput').value = dailyData.carbs || '';
    document.getElementById('fatsInput').value = dailyData.fats || '';
    document.getElementById('caloriesInput').value = dailyData.calories || '';

    document.getElementById('weightValue').textContent = dailyData.weight || '-';
    document.getElementById('cardioValue').textContent = dailyData.cardio || '0';
    document.getElementById('proteinValue').textContent = dailyData.protein || '0';
    document.getElementById('waterValue').textContent = dailyData.water || '0';
    document.getElementById('sleepValue').textContent = dailyData.sleep || '0';
    document.getElementById('carbsValue').textContent = dailyData.carbs || '0';
    document.getElementById('fatsValue').textContent = dailyData.fats || '0';
    document.getElementById('caloriesValue').textContent = dailyData.calories || '0';

    updateDailyProgress();
}

async function updateDailyMetric(metric, value) {
    if (!currentUser || !database) return;
    
    const today = new Date().toDateString();
    dailyData[metric] = value;
    
    try {
        await database.ref(`users/${currentUser.uid}/dailyMetrics/${today}/${metric}`).set(value);
        updateDailyInterface();
        
    } catch (error) {
        console.error('Error updating metric:', error);
        showNotification('Error updating metric', 'error');
    }
}

async function saveDailyData() {
    if (!currentUser || !database) return;
    const today = new Date().toDateString();
    const saveBtn = document.getElementById('saveDailyBtn');
    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span>⏳</span> Saving...';
        // Collect all metrics
        dailyData.weight = parseFloat(document.getElementById('weightInput').value) || '';
        dailyData.cardio = parseFloat(document.getElementById('cardioInput').value) || '';
        dailyData.protein = parseFloat(document.getElementById('proteinInput').value) || '';
        dailyData.water = parseFloat(document.getElementById('waterInput').value) || '';
        dailyData.sleep = parseFloat(document.getElementById('sleepInput').value) || '';
        dailyData.training = document.getElementById('trainingCheck').checked;
        dailyData.mealprep = document.getElementById('mealprepCheck').checked;
        dailyData.mood = document.getElementById('moodInput').value || '';
        dailyData.carbs = parseFloat(document.getElementById('carbsInput').value) || '';
        dailyData.fats = parseFloat(document.getElementById('fatsInput').value) || '';
        dailyData.calories = parseFloat(document.getElementById('caloriesInput').value) || '';
        // Calculate points
        const points = calculateDailyPoints();
        dailyData.points = points;
        dailyData.date = today;
        dailyData.timestamp = new Date().toISOString();
        // Save to Firebase
        await database.ref(`users/${currentUser.uid}/dailyMetrics/${today}`).set(dailyData);
        // Update streak
        await updateStreak();
        // Update total score
        await database.ref(`users/${currentUser.uid}/score`).transaction((score) => {
            return (score || 0) + points;
        });
        showNotification('Daily progress saved! 🎉', 'success');
    } catch (error) {
        console.error('Error saving daily data:', error);
        showNotification('Error saving data', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>💾</span> Save Today\'s Progress';
        loadHistoryData();
    }
}

function calculateDailyPoints() {
    let points = 0;
    if (dailyData.weight) points += 5;
    if (dailyData.training) points += 20;
    if (dailyData.mealprep) points += 10;
    if (dailyData.cardio && dailyData.cardio >= 30) points += 15;
    if (dailyData.protein && dailyData.protein >= 100) points += 10;
    if (dailyData.water && dailyData.water >= 2) points += 10;
    if (dailyData.sleep && dailyData.sleep >= 7) points += 10;
    return points;
}

function updateDailyProgress() {
    const maxTasks = 7; // weight, training, mealprep, cardio, protein, water, sleep
    let completedTasks = 0;
    if (dailyData.weight) completedTasks++;
    if (dailyData.training) completedTasks++;
    if (dailyData.mealprep) completedTasks++;
    if (dailyData.cardio && dailyData.cardio > 0) completedTasks++;
    if (dailyData.protein && dailyData.protein > 0) completedTasks++;
    if (dailyData.water && dailyData.water > 0) completedTasks++;
    if (dailyData.sleep && dailyData.sleep > 0) completedTasks++;
    const percentage = (completedTasks / maxTasks) * 100;
    document.getElementById('dailyProgressFill').style.width = percentage + '%';
    document.getElementById('dailyProgressPercent').textContent = Math.round(percentage) + '%';
}

async function updateStreak() {
    if (!currentUser || !database) return;
    
    try {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const yesterdayStr = yesterday.toDateString();
        const yesterdaySnapshot = await database.ref(`users/${currentUser.uid}/dailyMetrics/${yesterdayStr}`).once('value');
        
        let newStreak = 1;
        if (yesterdaySnapshot.exists()) {
            const currentStreak = userData.streak || 0;
            newStreak = currentStreak + 1;
        }
        
        await database.ref(`users/${currentUser.uid}/streak`).set(newStreak);
        userData.streak = newStreak;
        updateStreakIndicator();
        
    } catch (error) {
        console.error('Error updating streak:', error);
    }
}

// History Logs Functions
function renderHistoryLogs() {
    const logList = document.getElementById('historyLogList');
    logList.innerHTML = '';
    if (!userData.dailyMetrics) return;
    const dates = Object.keys(userData.dailyMetrics).sort((a, b) => new Date(b) - new Date(a));
    let latestWeight = null;
    for (let i = 0; i < dates.length; i++) {
        const entry = userData.dailyMetrics[dates[i]];
        if (entry.weight && !latestWeight) latestWeight = Number(entry.weight);
    }
    dates.forEach(date => {
        const entry = userData.dailyMetrics[date];
        // Use that day's weight or latestWeight
        const weight = entry.weight ? Number(entry.weight) : latestWeight;
        const proteinTarget = weight ? Math.round(weight * 1.8) : null;
        const proteinSatisfied = (proteinTarget && entry.protein && entry.protein >= proteinTarget);
        const log = document.createElement('div');
        log.className = 'history-log-item' + (date === selectedDate ? ' active' : '');
        log.innerHTML = `
            <div class="history-log-date">${new Date(date).toLocaleDateString()}</div>
            <div class="history-log-summary">
                <span>Points: ${entry.points || 0}</span>
                <span>Weight: ${entry.weight || '-'}</span>
                <span>Training: ${entry.training ? '\u2705' : '\u274c'}</span>
                <span>Protein: ${proteinSatisfied ? 'Satisfied \u2705' : 'Not satisfied \u274c'}</span>
                <span>Mood: ${entry.mood ? entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1) : '-'}</span>
                <span>Carbs: ${entry.carbs || 0}g</span>
                <span>Fats: ${entry.fats || 0}g</span>
                <span>Calories: ${entry.calories || 0}</span>
            </div>
        `;
        log.onclick = () => {
            selectedDate = date;
            renderHistoryLogs();
            showHistoryDetails(date);
        };
        logList.appendChild(log);
    });
}

async function loadHistoryData() {
    if (!currentUser || !database) return;
    try {
        const snapshot = await database.ref(`users/${currentUser.uid}/dailyMetrics`).once('value');
        if (snapshot.exists()) {
            historyData = snapshot.val();
            userData.dailyMetrics = historyData;
        }
        renderHistoryLogs();
        showHistoryDetails(selectedDate);
        renderProgressChart();
    } catch (error) {
        console.error('Error loading history data:', error);
    }
}

function showHistoryDetails(dateStr) {
    if (!historyData || !historyData[dateStr]) return;
    const data = historyData[dateStr];
    const detailsContainer = document.getElementById('historyDetails');
    const date = new Date(dateStr);
    // Use that day's weight or latestWeight
    let latestWeight = null;
    const dates = Object.keys(historyData).sort((a, b) => new Date(b) - new Date(a));
    for (let i = 0; i < dates.length; i++) {
        const entry = historyData[dates[i]];
        if (entry.weight && !latestWeight) latestWeight = Number(entry.weight);
    }
    const weight = data.weight ? Number(data.weight) : latestWeight;
    const proteinTarget = weight ? Math.round(weight * 1.8) : null;
    const proteinSatisfied = (proteinTarget && data.protein && data.protein >= proteinTarget);
    detailsContainer.innerHTML = `
        <h4>${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
        <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">Weight</div>
                <div style="font-size: 1.25rem; font-weight: 600;">${data.weight || '-'} kg</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">Training</div>
                <div style="font-size: 1.25rem; font-weight: 600;">${data.training ? '\u2705 Completed' : '\u274c Not done'}</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">Cardio</div>
                <div style="font-size: 1.25rem; font-weight: 600;">${data.cardio || 0} min</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">Protein</div>
                <div style="font-size: 1.25rem; font-weight: 600;">${data.protein || 0} g (${proteinSatisfied ? 'Satisfied \u2705' : 'Not satisfied \u274c'})</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">Water</div>
                <div style="font-size: 1.25rem; font-weight: 600;">${data.water || 0} L</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">Sleep</div>
                <div style="font-size: 1.25rem; font-weight: 600;">${data.sleep || 0} hrs</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">Mood/Energy</div>
                <div style="font-size: 1.25rem; font-weight: 600;">${data.mood ? data.mood.charAt(0).toUpperCase() + data.mood.slice(1) : '-'}</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">Carbs</div>
                <div style="font-size: 1.25rem; font-weight: 600;">${data.carbs || 0} g</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">Fats</div>
                <div style="font-size: 1.25rem; font-weight: 600;">${data.fats || 0} g</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">Calories</div>
                <div style="font-size: 1.25rem; font-weight: 600;">${data.calories || 0}</div>
            </div>
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 600;">Daily Score</span>
                <span>${data.points || 0}</span>
            </div>
        </div>
    `;
}

function renderProgressChart() {
    const chartContainer = document.getElementById('progressChart');
    chartContainer.innerHTML = '';
    
    // Get last 30 days of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    const days = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
    }
    
    // Find max points for scaling
    let maxPoints = 20; // Default minimum
    days.forEach(day => {
        const dayData = historyData[day.toDateString()];
        if (dayData && dayData.points > maxPoints) {
            maxPoints = dayData.points;
        }
    });
    
    // Create bars
    days.forEach((day, index) => {
        const dayData = historyData[day.toDateString()];
        const points = dayData ? dayData.points : 0;
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.left = `${(index / days.length) * 100}%`;
        bar.style.height = `${(points / maxPoints) * 100}%`;
        bar.style.width = `${(1 / days.length) * 100 - 2}%`;
        
        // Tooltip
        bar.title = `${day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${points} pts`;
        
        chartContainer.appendChild(bar);
    });
}

// Chat Functions
function broadcastTyping(isTyping) {
    if (!currentUser || !database) return;
    database.ref(`users/${currentUser.uid}/typing`).set(isTyping);
}

function setupTypingListener() {
    if (!database) return;
    database.ref('users').on('value', (snapshot) => {
        if (snapshot.exists()) {
            const users = snapshot.val();
            const typingUsers = Object.values(users).filter(u => u.typing && u.isOnline && u.uid !== (currentUser ? currentUser.uid : null));
            const indicator = document.getElementById('chatTypingIndicator');
            if (typingUsers.length > 0) {
                const names = typingUsers.map(u => u.nickname || u.name || 'User');
                indicator.textContent = names.length === 1 ? `${names[0]} is typing...` : `${names.join(', ')} are typing...`;
            } else {
                indicator.textContent = '';
            }
        }
    });
}

function setupChatListener() {
    if (!database) return;
    database.ref('chat').limitToLast(50).on('child_added', (snapshot) => {
        const message = snapshot.val();
        displayChatMessage(message);
    });
    // Listen for online users
    database.ref('users').on('value', (snapshot) => {
        if (snapshot.exists()) {
            allUsers = snapshot.val();
            const onlineUsers = Object.values(allUsers).filter(user => user.isOnline);
            document.getElementById('onlineCount').textContent = onlineUsers.length;
            const onlineDiv = document.getElementById('chatOnlineUsers');
            onlineDiv.innerHTML = onlineUsers.map(u => `<span class="chat-online-avatar" title="${u.name}">${(u.name||'U')[0]}</span>`).join(' ');
        }
    });
    setupTypingListener();
}

function displayChatMessage(message) {
    const container = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    const isOwnMessage = message.uid === (currentUser ? currentUser.uid : null);
    messageDiv.className = `chat-message ${isOwnMessage ? 'own' : 'other'}`;
    const time = new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    messageDiv.innerHTML = `
        ${!isOwnMessage ? `<div class="chat-message-author">${message.nickname || message.name}</div>` : ''}
        <div>${message.text}</div>
        <div class="chat-message-time">${time}</div>
    `;
    container.appendChild(messageDiv);
    // Always scroll to bottom
    setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text || !currentUser || !database) return;
    
    try {
        const message = {
            uid: currentUser.uid,
            name: userData.name || 'User',
            nickname: userData.nickname || 'Challenger',
            text: text,
            timestamp: new Date().toISOString()
        };
        
        await database.ref('chat').push(message);
        input.value = '';
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Error sending message', 'error');
    }
}

// Utility Functions
function getErrorMessage(error) {
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
            return 'Password is too weak';
        case 'auth/popup-closed-by-user':
            return 'Google sign-in was cancelled';
        default:
            return error.message || 'An error occurred';
    }
}

function showTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    if (tabName === 'profile') {
        updateProfileSection();
    }
    if (tabName === 'chat') {
        setTimeout(() => {
            const container = document.getElementById('chatMessages');
            container.scrollTop = container.scrollHeight;
            setupChatInputTyping();
        }, 100);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function updateGlobalProgress() {
    const startDate = new Date('2025-06-01');
    const endDate = new Date('2026-06-01');
    const currentDate = new Date();
    
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const completedDays = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalDays - completedDays);
    
    const percentage = Math.max(0, Math.min(100, (completedDays / totalDays) * 100));
    
    document.getElementById('globalProgress').textContent = `Progress: ${percentage.toFixed(1)}%`;
    document.getElementById('daysRemaining').textContent = `Days left: ${remainingDays}`;
}

// Event Listeners for Metric Inputs
function setupMetricInputs() {
    const inputs = ['weightInput', 'cardioInput', 'proteinInput', 'waterInput', 'sleepInput'];
    
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        const metric = inputId.replace('Input', '');
        
        input.addEventListener('input', () => {
            const value = parseFloat(input.value) || 0;
            updateDailyMetric(metric, value);
            document.getElementById(metric + 'Value').textContent = value;
        });
    });
    
    // Chat input enter key
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Page Visibility API for online status
document.addEventListener('visibilitychange', () => {
    if (currentUser) {
        updateUserOnlineStatus(!document.hidden);
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        updateUserOnlineStatus(false);
    }
});

// Initialize when page loads
window.addEventListener('load', () => {
    console.log('🚀 Starting الأبطال...');
    updateGlobalProgress();
    setupMetricInputs();
    
    setTimeout(() => {
        if (initializeFirebase()) {
            console.log('✅ App initialized successfully');
        } else {
            console.error('❌ App initialization failed');
        }
    }, 1000);
    setupChatInputTyping();
});

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Profile tab logic
function updateProfileSection() {
    if (!userData) return;
    document.getElementById('profileAvatar').textContent = (userData.name || 'U').charAt(0).toUpperCase();
    document.getElementById('profileName').textContent = userData.name || 'User';
    document.getElementById('profileNickname').textContent = userData.nickname || '';
    document.getElementById('profileStreak').textContent = (userData.streak || 0) + ' 🔥';
    document.getElementById('profilePoints').textContent = userData.score || 0;
    document.getElementById('profileJoinDate').textContent = userData.joinDate ? new Date(userData.joinDate).toLocaleDateString() : '-';
    document.getElementById('profileHeightDisplay').textContent = userData.height ? userData.height + ' cm' : '-';
    // Fill edit fields
    document.getElementById('editProfileName').value = userData.name || '';
    document.getElementById('editProfileNickname').value = userData.nickname || '';
    document.getElementById('editProfileHeight').value = userData.height || '';
    // Calculate weekly avg weight
    let weights = [];
    let bestStreak = 0;
    let daysActive = 0;
    let longestStreak = 0;
    let consistency = 0;
    let latestWeight = null;
    if (userData.dailyMetrics) {
        const dates = Object.keys(userData.dailyMetrics).sort((a, b) => new Date(b) - new Date(a));
        let streak = 0;
        let prevDate = null;
        for (let i = 0; i < dates.length; i++) {
            const d = dates[i];
            const entry = userData.dailyMetrics[d];
            if (i === 0 && entry.weight) latestWeight = Number(entry.weight);
            if (i < 7 && entry.weight) weights.push(Number(entry.weight));
            if (entry.points && entry.points > 0) {
                daysActive++;
                if (prevDate) {
                    const diff = (new Date(prevDate) - new Date(d)) / (1000*60*60*24);
                    if (diff === 1) {
                        streak++;
                    } else {
                        streak = 1;
                    }
                } else {
                    streak = 1;
                }
                if (streak > longestStreak) longestStreak = streak;
                prevDate = d;
            }
        }
        bestStreak = longestStreak;
        consistency = Math.round((daysActive / dates.length) * 100);
    }
    const avgWeight = weights.length ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : '-';
    document.getElementById('profileWeeklyAvg').textContent = avgWeight;
    document.getElementById('profileBestStreak').textContent = bestStreak;
    document.getElementById('profileConsistency').innerHTML = 'Consistency Score: <span>' + (consistency || '-') + '%</span>';
    document.getElementById('profileDaysActive').innerHTML = 'Days Active: <span>' + (daysActive || '-') + '</span>';
    document.getElementById('profileLongestStreak').innerHTML = 'Longest Streak: <span>' + (bestStreak || '-') + '</span>';
    // BMI and protein
    let heightM = userData.height ? userData.height / 100 : null;
    let bmi = (latestWeight && heightM) ? (latestWeight / (heightM * heightM)).toFixed(1) : '-';
    document.getElementById('profileBMI').textContent = bmi;
    let proteinTargetLow = (latestWeight && userData.height) ? Math.round(latestWeight * 1.8) : '-';
    let proteinTargetHigh = (latestWeight && userData.height) ? Math.round(latestWeight * 2.2) : '-';
    document.getElementById('profileProteinTarget').textContent = (proteinTargetLow !== '-' && proteinTargetHigh !== '-') ? `${proteinTargetLow} - ${proteinTargetHigh}` : '-';
}

// Save height when changed
const heightInput = document.getElementById('profileHeight');
if (heightInput) {
    heightInput.addEventListener('change', async function() {
        const val = parseFloat(this.value);
        if (!currentUser || !database || isNaN(val)) return;
        await database.ref(`users/${currentUser.uid}/height`).set(val);
        userData.height = val;
        updateProfileSection();
    });
}

// Profile: Edit and Save
const saveProfileBtn = document.getElementById('saveProfileBtn');
if (saveProfileBtn) {
    saveProfileBtn.onclick = async function() {
        const name = document.getElementById('editProfileName').value.trim();
        const nickname = document.getElementById('editProfileNickname').value.trim();
        const height = parseFloat(document.getElementById('editProfileHeight').value);
        if (!currentUser || !database) return;
        if (name) await database.ref(`users/${currentUser.uid}/name`).set(name);
        if (nickname) await database.ref(`users/${currentUser.uid}/nickname`).set(nickname);
        if (!isNaN(height)) await database.ref(`users/${currentUser.uid}/height`).set(height);
        showNotification('Profile updated!', 'success');
        loadUserData();
    };
}

// Leaderboard: Show all users with stats
async function loadLeaderboard() {
    if (!database) return;
    try {
        const snapshot = await database.ref('users').once('value');
        const tbody = document.getElementById('leaderboardBody');
        tbody.innerHTML = '';
        if (snapshot.exists()) {
            const users = snapshot.val();
            // Debug: print all loaded users
            console.log('Loaded users for leaderboard:', users);
            Object.keys(users).forEach(uid => {
                const user = users[uid];
                // Calculate weekly avg weight and BMI
                let weights = [];
                let bestStreak = 0;
                let daysActive = 0;
                let longestStreak = 0;
                let latestWeight = null;
                if (user.dailyMetrics) {
                    const dates = Object.keys(user.dailyMetrics).sort((a, b) => new Date(b) - new Date(a));
                    let streak = 0;
                    let prevDate = null;
                    for (let i = 0; i < dates.length; i++) {
                        const d = dates[i];
                        const entry = user.dailyMetrics[d];
                        if (i === 0 && entry.weight) latestWeight = Number(entry.weight);
                        if (i < 7 && entry.weight) weights.push(Number(entry.weight));
                        if (entry.points && entry.points > 0) {
                            daysActive++;
                            if (prevDate) {
                                const diff = (new Date(prevDate) - new Date(d)) / (1000*60*60*24);
                                if (diff === 1) {
                                    streak++;
                                } else {
                                    streak = 1;
                                }
                            } else {
                                streak = 1;
                            }
                            if (streak > longestStreak) longestStreak = streak;
                            prevDate = d;
                        }
                    }
                    bestStreak = longestStreak;
                }
                const avgWeight = weights.length ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : '-';
                let heightM = user.height ? user.height / 100 : null;
                let bmi = (latestWeight && heightM) ? (latestWeight / (heightM * heightM)).toFixed(1) : '-';
                // Defensive: handle missing fields
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.name ? user.name : '-'}</td>
                    <td>${user.nickname ? user.nickname : '-'}</td>
                    <td>${user.streak !== undefined ? user.streak : 0}</td>
                    <td>${bestStreak}</td>
                    <td>${user.score !== undefined ? user.score : 0}</td>
                    <td>${avgWeight}</td>
                    <td>${bmi}</td>
                    <td>${user.joinDate ? new Date(user.joinDate).toLocaleDateString() : '-'}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}
// Load leaderboard when leaderboard tab is shown
const leaderboardTab = document.querySelector('button[onclick*="showTab(\'leaderboard\')"]');
if (leaderboardTab) {
    leaderboardTab.addEventListener('click', loadLeaderboard);
}

// Enhance chat input to broadcast typing
function setupChatInputTyping() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('input', () => {
            broadcastTyping(true);
            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => broadcastTyping(false), 2000);
        });
        chatInput.addEventListener('blur', () => broadcastTyping(false));
    }
} 