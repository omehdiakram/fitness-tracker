// Authentication Module
window.auth = {
    // Show different forms
    showLoginForm() {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('forgotPasswordForm').classList.add('hidden');
    },

    showRegisterForm() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
        document.getElementById('forgotPasswordForm').classList.add('hidden');
    },

    showForgotPasswordForm() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('forgotPasswordForm').classList.remove('hidden');
    },

    // Login user
    async loginUser() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            ui.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!firebase.auth()) {
            ui.showNotification('Firebase not initialized. Please refresh the page.', 'error');
            return;
        }

        try {
            console.log('🔑 Attempting login...');
            await firebase.auth().signInWithEmailAndPassword(email, password);
            ui.showNotification('Welcome back! 🎉', 'success');
        } catch (error) {
            console.error('Login error:', error);
            ui.showNotification(getFirebaseErrorMessage(error), 'error');
        }
    },

    // Register new user
    async registerUser() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const nickname = document.getElementById('registerNickname').value.trim();
        
        if (!name || !email || !password || !nickname) {
            ui.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (password.length < 6) {
            ui.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        if (!firebase.auth() || !database) {
            ui.showNotification('Firebase not initialized. Please refresh the page.', 'error');
            return;
        }

        try {
            console.log('📝 Creating account...');
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update user profile
            await user.updateProfile({ displayName: name });
            
            // Create user data in database
            const initialUserData = {
                uid: user.uid,
                name: name,
                nickname: nickname,
                email: email,
                score: 0,
                streak: 0,
                bestStreak: 0,
                joinDate: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                isOnline: true,
                dailyMetrics: {},
                mealPhotos: {},
                weeklyScores: {}
            };
            
            await database.ref(`users/${user.uid}`).set(initialUserData);
            ui.showNotification('Account created successfully! Welcome to FitSquad Pro! 🎉', 'success');
            
        } catch (error) {
            console.error('Registration error:', error);
            ui.showNotification(getFirebaseErrorMessage(error), 'error');
        }
    },

    // Google Sign In
    async signInWithGoogle() {
        if (!firebase.auth()) {
            ui.showNotification('Firebase not initialized. Please refresh the page.', 'error');
            return;
        }

        try {
            console.log('🔍 Google sign-in...');
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;
            
            // Check if user exists in database
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
                    bestStreak: 0,
                    joinDate: new Date().toISOString(),
                    lastActive: new Date().toISOString(),
                    isOnline: true,
                    dailyMetrics: {},
                    mealPhotos: {},
                    weeklyScores: {}
                };
                
                await database.ref(`users/${user.uid}`).set(initialUserData);
            }
            
            ui.showNotification('Welcome to FitSquad Pro! 🎉', 'success');
            
        } catch (error) {
            console.error('Google sign-in error:', error);
            if (error.code !== 'auth/popup-closed-by-user') {
                ui.showNotification('Google sign-in failed: ' + getFirebaseErrorMessage(error), 'error');
            }
        }
    },

    // Reset Password
    async resetPassword() {
        const email = document.getElementById('forgotEmail').value.trim();
        
        if (!email) {
            ui.showNotification('Please enter your email address', 'error');
            return;
        }

        if (!firebase.auth()) {
            ui.showNotification('Firebase not initialized. Please refresh the page.', 'error');
            return;
        }

        try {
            await firebase.auth().sendPasswordResetEmail(email);
            ui.showNotification('Password reset email sent! Check your inbox 📧', 'success');
            this.showLoginForm();
        } catch (error) {
            console.error('Password reset error:', error);
            ui.showNotification(getFirebaseErrorMessage(error), 'error');
        }
    },

    // Sign Out
    async signOut() {
        if (!firebase.auth()) return;
        
        try {
            if (currentUser) {
                await database.ref(`users/${currentUser.uid}/isOnline`).set(false);
            }
            await firebase.auth().signOut();
            ui.showNotification('Signed out successfully', 'success');
        } catch (error) {
            console.error('Sign out error:', error);
            ui.showNotification('Error signing out', 'error');
        }
    }
};
