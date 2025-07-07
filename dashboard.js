// Dashboard Module
const dashboard = {
    userData: {},
    dailyData: {},
    
    // Load user data from database
    async loadUserData() {
        if (!currentUser || !database) return;
        
        try {
            const snapshot = await database.ref(`users/${currentUser.uid}`).once('value');
            if (snapshot.exists()) {
                this.userData = snapshot.val();
                this.updateUserInterface();
                this.loadLeaderboard();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    },

    // Update user interface elements
    updateUserInterface() {
        document.getElementById('userName').textContent = this.userData.name || 'User';
        document.getElementById('userAvatar').textContent = (this.userData.name || 'U').charAt(0).toUpperCase();
        document.getElementById('totalScore').textContent = this.userData.score || 0;
        document.getElementById('currentStreak').textContent = this.userData.streak || 0;
        document.getElementById('bestStreak').textContent = this.userData.bestStreak || 0;
        
        // Update weekly score
        this.calculateWeeklyScore();
    },

    // Calculate weekly score
    async calculateWeeklyScore() {
        if (!currentUser || !database) return;

        try {
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            
            let weeklyScore = 0;
            
            for (let i = 0; i < 7; i++) {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                const dateStr = date.toDateString();
                
                const snapshot = await database.ref(`users/${currentUser.uid}/dailyMetrics/${dateStr}`).once('value');
                if (snapshot.exists()) {
                    const dayData = snapshot.val();
                    weeklyScore += dayData.points || 0;
                }
            }
            
            document.getElementById('weeklyScore').textContent = weeklyScore;
        } catch (error) {
            console.error('Error calculating weekly score:', error);
        }
    },

    // Load today's data
    async loadTodayData() {
        if (!currentUser || !database) return;
        
        const today = new Date().toDateString();
        
        try {
            const snapshot = await database.ref(`users/${currentUser.uid}/dailyMetrics/${today}`).once('value');
            if (snapshot.exists()) {
                this.dailyData = snapshot.val();
            } else {
                this.dailyData = {};
            }
            this.updateDailyInterface();
        } catch (error) {
            console.error('Error loading today data:', error);
        }
    },

    // Update daily interface
    updateDailyInterface() {
        // Update input values
        document.getElementById('weightInput').value = this.dailyData.weight || '';
        document.getElementById('cardioInput').value = this.dailyData.cardio || '';
        document.getElementById('proteinInput').value = this.dailyData.protein || '';
        document.getElementById('waterInput').value = this.dailyData.water || '';
        document.getElementById('sleepInput').value = this.dailyData.sleep || '';
        document.getElementById('trainingCheck').checked = this.dailyData.training || false;

        // Update display values
        document.getElementById('weightValue').textContent = this.dailyData.weight || '-';
        document.getElementById('cardioValue').textContent = this.dailyData.cardio || '0';
        document.getElementById('proteinValue').textContent = this.dailyData.protein || '0';
        document.getElementById('waterValue').textContent = this.dailyData.water || '0';
        document.getElementById('sleepValue').textContent = this.dailyData.sleep || '0';
        document.getElementById('mealPrepCount').textContent = this.dailyData.mealPhotos || '0';

        this.updateDailyProgress();
        this.updateTodayScore();
    },

    // Update daily progress bar
    updateDailyProgress() {
        const maxTasks = 7; // weight, training, cardio, protein, water, sleep, meal prep
        let completedTasks = 0;
        
        if (this.dailyData.weight) completedTasks++;
        if (this.dailyData.training) completedTasks++;
        if (this.dailyData.cardio && this.dailyData.cardio > 0) completedTasks++;
        if (this.dailyData.protein && this.dailyData.protein > 0) completedTasks++;
        if (this.dailyData.water && this.dailyData.water > 0) completedTasks++;
        if (this.dailyData.sleep && this.dailyData.sleep > 0) completedTasks++;
        if (this.dailyData.mealPhotos && this.dailyData.mealPhotos > 0) completedTasks++;
        
        const percentage = (completedTasks / maxTasks) * 100;
        
        document.getElementById('dailyProgressFill').style.width = percentage + '%';
        document.getElementById('dailyProgressPercent').textContent = Math.round(percentage) + '%';
    },

    // Update today's score display
    updateTodayScore() {
        const points = this.calculateDailyPoints();
        document.getElementById('todayScore').textContent = points;
    },

    // Calculate daily points
    calculateDailyPoints() {
        let points = 0;
        
        // Weight tracking: 5 points
        if (this.dailyData.weight) points += 5;
        
        // Training completion: 20 points
        if (this.dailyData.training) points += 20;
        
        // Cardio (30+ minutes): 15 points
        if (this.dailyData.cardio && this.dailyData.cardio >= 30) points += 15;
        
        // Protein intake (100g+): 10 points
        if (this.dailyData.protein && this.dailyData.protein >= 100) points += 10;
        
        // Water intake (2L+): 10 points
        if (this.dailyData.water && this.dailyData.water >= 2) points += 10;
        
        // Sleep (7+ hours): 10 points
        if (this.dailyData.sleep && this.dailyData.sleep >= 7) points += 10;
        
        // Meal prep photos: 5 points each (max 20 points)
        if (this.dailyData.mealPhotos) {
            points += Math.min(this.dailyData.mealPhotos * 5, 20);
        }
        
        return points;
    },

    // Update daily metric
    async updateDailyMetric(metric, value) {
        if (!currentUser || !database) return;
        
        const today = new Date().toDateString();
        this.dailyData[metric] = value;
        
        try {
            await database.ref(`users/${currentUser.uid}/dailyMetrics/${today}/${metric}`).set(value);
            
            // Update the display value
            const valueElement = document.getElementById(metric + 'Value');
            if (valueElement) {
                valueElement.textContent = value || '0';
            }
            
            this.updateDailyInterface();
            
        } catch (error) {
            console.error('Error updating metric:', error);
            ui.showNotification('Error updating metric', 'error');
        }
    },

    // Save daily data and calculate streak
    async saveDailyData() {
        if (!currentUser || !database) return;
        
        const today = new Date().toDateString();
        const points = this.calculateDailyPoints();
        
        try {
            // Save daily points
            await database.ref(`users/${currentUser.uid}/dailyMetrics/${today}/points`).set(points);
            await database.ref(`users/${currentUser.uid}/dailyMetrics/${today}/saved`).set(true);
            await database.ref(`users/${currentUser.uid}/dailyMetrics/${today}/saveDate`).set(new Date().toISOString());
            
            // Update total score
            const newTotalScore = (this.userData.score || 0) + points;
            await database.ref(`users/${currentUser.uid}/score`).set(newTotalScore);
            
            // Calculate and update streak
            await this.calculateStreak();
            
            ui.showNotification(`Day saved! +${points} points! 🎉`, 'success');
            
            // Reload data to reflect changes
            await this.loadUserData();
            await this.loadTodayData();
            
        } catch (error) {
            console.error('Error saving daily data:', error);
            ui.showNotification('Error saving daily data', 'error');
        }
    },

    // Calculate streak
    async calculateStreak() {
        if (!currentUser || !database) return;
        
        try {
            const metricsSnapshot = await database.ref(`users/${currentUser.uid}/dailyMetrics`).once('value');
            
            if (!metricsSnapshot.exists()) {
                await database.ref(`users/${currentUser.uid}/streak`).set(0);
                return;
            }
            
            const metrics = metricsSnapshot.val();
            const sortedDates = Object.keys(metrics)
                .filter(date => metrics[date].saved)
                .sort((a, b) => new Date(b) - new Date(a));
            
            let currentStreak = 0;
            let maxStreak = 0;
            let tempStreak = 0;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Calculate current streak (consecutive days from today backwards)
            for (let i = 0; i < sortedDates.length; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                const checkDateStr = checkDate.toDateString();
                
                if (sortedDates.includes(checkDateStr)) {
                    currentStreak++;
                } else {
                    break;
                }
            }
            
            // Calculate max streak (all time best)
            for (let i = 0; i < sortedDates.length; i++) {
                const currentDate = new Date(sortedDates[i]);
                const nextDate = i < sortedDates.length - 1 ? new Date(sortedDates[i + 1]) : null;
                
                tempStreak++;
                
                if (!nextDate || Math.abs(currentDate - nextDate) > 24 * 60 * 60 * 1000) {
                    maxStreak = Math.max(maxStreak, tempStreak);
                    tempStreak = 0;
                }
            }
            
            // Update streaks in database
            await database.ref(`users/${currentUser.uid}/streak`).set(currentStreak);
            await database.ref(`users/${currentUser.uid}/bestStreak`).set(Math.max(maxStreak, this.userData.bestStreak || 0));
            
        } catch (error) {
            console.error('Error calculating streak:', error);
        }
    },

    // Load leaderboard
    async loadLeaderboard() {
        if (!database) return;
        
        try {
            const snapshot = await database.ref('users').orderByChild('score').limitToLast(10).once('value');
            
            if (snapshot.exists()) {
                const users = [];
                snapshot.forEach(child => {
                    const userData = child.val();
                    users.push(userData);
                });
                
                // Sort by score descending
                users.sort((a, b) => (b.score || 0) - (a.score || 0));
                
                this.displayLeaderboard(users);
                
                // Update current leader in header
                if (users.length > 0) {
                    document.getElementById('currentLeader').textContent = `Leader: ${users[0].nickname || users[0].name}`;
                }
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    },

    // Display leaderboard
    displayLeaderboard(users) {
        const container = document.getElementById('leaderboardContainer');
        container.innerHTML = '';
        
        if (users.length === 0) {
            container.innerHTML = '<p>No users found</p>';
            return;
        }
        
        const list = document.createElement('div');
        list.className = 'leaderboard-list';
        
        users.forEach((user, index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item ${user.uid === currentUser?.uid ? 'current-user' : ''}`;
            
            const rank = index + 1;
            const rankClass = rank <= 3 ? 'top-3' : '';
            
            item.innerHTML = `
                <div class="leaderboard-rank ${rankClass}">#${rank}</div>
                <div class="leaderboard-user">
                    <div class="leaderboard-name">${user.name}</div>
                    <div class="leaderboard-nickname">"${user.nickname}"</div>
                    <div class="leaderboard-streak">🔥 ${user.streak || 0} day streak</div>
                </div>
                <div class="leaderboard-score">${user.score || 0}</div>
            `;
            
            list.appendChild(item);
        });
        
        container.appendChild(list);
        
        // Update user rank in stats
        const userRank = users.findIndex(user => user.uid === currentUser?.uid) + 1;
        document.getElementById('userRank').textContent = userRank > 0 ? `#${userRank}` : '#-';
    },

    // Setup metric input listeners
    setupMetricInputs() {
        const inputs = ['weightInput', 'cardioInput', 'proteinInput', 'waterInput', 'sleepInput'];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            const metric = inputId.replace('Input', '');
            
            if (input) {
                input.addEventListener('input', () => {
                    const value = parseFloat(input.value) || 0;
                    this.updateDailyMetric(metric, value);
                });
            }
        });
        
        // Training checkbox
        const trainingCheck = document.getElementById('trainingCheck');
        if (trainingCheck) {
            trainingCheck.addEventListener('change', () => {
                this.updateDailyMetric('training', trainingCheck.checked);
            });
        }
    }
};
