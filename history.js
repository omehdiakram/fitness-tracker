// History Module
window.history = {
    // Populate month picker
    populateMonthPicker() {
        const picker = document.getElementById('historyMonthPicker');
        if (!picker) return;
        
        picker.innerHTML = '<option value="">Select Month</option>';
        
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        
        // Add current and previous 6 months
        for (let i = 0; i <= 6; i++) {
            const date = new Date(currentYear, currentMonth - i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const text = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            picker.appendChild(option);
        }
    },

    // Load history for specific date
    async loadDateHistory() {
        const datePicker = document.getElementById('historyDatePicker');
        if (!datePicker || !datePicker.value || !currentUser || !database) return;
        
        const selectedDate = new Date(datePicker.value);
        const dateString = selectedDate.toDateString();
        
        try {
            const snapshot = await database.ref(`users/${currentUser.uid}/dailyMetrics/${dateString}`).once('value');
            const container = document.getElementById('historyContainer');
            
            if (snapshot.exists()) {
                const dayData = snapshot.val();
                this.displayDayHistory(dateString, dayData);
            } else {
                container.innerHTML = `
                    <div class="history-day">
                        <div class="history-date">${selectedDate.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</div>
                        <p style="text-align: center; color: var(--text-secondary); padding: 20px;">
                            No data recorded for this date
                        </p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading date history:', error);
            ui.showNotification('Error loading history', 'error');
        }
    },

    // Load history for specific month
    async loadMonthHistory() {
        const monthPicker = document.getElementById('historyMonthPicker');
        if (!monthPicker || !monthPicker.value || !currentUser || !database) return;
        
        const [year, month] = monthPicker.value.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);
        
        try {
            const snapshot = await database.ref(`users/${currentUser.uid}/dailyMetrics`).once('value');
            const container = document.getElementById('historyContainer');
            container.innerHTML = '';
            
            if (snapshot.exists()) {
                const allData = snapshot.val();
                const monthData = [];
                
                // Filter data for the selected month
                for (let day = 1; day <= endDate.getDate(); day++) {
                    const checkDate = new Date(parseInt(year), parseInt(month) - 1, day);
                    const dateString = checkDate.toDateString();
                    
                    if (allData[dateString]) {
                        monthData.push({
                            date: dateString,
                            data: allData[dateString]
                        });
                    }
                }
                
                if (monthData.length > 0) {
                    // Sort by date (most recent first)
                    monthData.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    monthData.forEach(day => {
                        this.displayDayHistory(day.date, day.data);
                    });
                    
                    // Add month summary
                    this.displayMonthSummary(monthData, startDate);
                } else {
                    container.innerHTML = `
                        <div class="card">
                            <h3 class="card-title">📅 ${startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</h3>
                            <p style="text-align: center; color: var(--text-secondary); padding: 20px;">
                                No data recorded for this month
                            </p>
                        </div>
                    `;
                }
            } else {
                container.innerHTML = '<p>No history data found</p>';
            }
        } catch (error) {
            console.error('Error loading month history:', error);
            ui.showNotification('Error loading history', 'error');
        }
    },

    // Display day history
    async displayDayHistory(dateString, dayData) {
        const container = document.getElementById('historyContainer');
        const date = new Date(dateString);
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'history-day';
        
        // Load meal photos for this date
        const mealPhotos = await mealPrep.loadMealPhotosForDate(dateString);
        
        dayDiv.innerHTML = `
            <div class="history-date">
                ${date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}
                ${dayData.saved ? '<span style="color: var(--success-color); margin-left: 10px;">✅ Saved</span>' : ''}
            </div>
            
            <div class="history-metrics">
                <div class="history-metric">
                    <div class="history-metric-value">${dayData.weight || '-'}</div>
                    <div class="history-metric-label">Weight (kg)</div>
                </div>
                <div class="history-metric">
                    <div class="history-metric-value">${dayData.training ? '✅' : '❌'}</div>
                    <div class="history-metric-label">Training</div>
                </div>
                <div class="history-metric">
                    <div class="history-metric-value">${dayData.cardio || 0}</div>
                    <div class="history-metric-label">Cardio (min)</div>
                </div>
                <div class="history-metric">
                    <div class="history-metric-value">${dayData.protein || 0}</div>
                    <div class="history-metric-label">Protein (g)</div>
                </div>
                <div class="history-metric">
                    <div class="history-metric-value">${dayData.water || 0}</div>
                    <div class="history-metric-label">Water (L)</div>
                </div>
                <div class="history-metric">
                    <div class="history-metric-value">${dayData.sleep || 0}</div>
                    <div class="history-metric-label">Sleep (hrs)</div>
                </div>
                <div class="history-metric">
                    <div class="history-metric-value">${mealPhotos.length}</div>
                    <div class="history-metric-label">Meal Photos</div>
                </div>
            </div>
            
            ${mealPhotos.length > 0 ? `
                <div style="margin-top: 16px;">
                    <h4 style="margin-bottom: 12px; font-size: 0.9rem; color: var(--text-secondary);">Meal Photos:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px;">
                        ${mealPhotos.map(photo => `
                            <div style="aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: var(--background-color);">
                                <img src="${photo.url}" alt="Meal" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="history-score">
                Score: ${dayData.points || 0} points
            </div>
        `;
        
        container.appendChild(dayDiv);
    },

    // Display month summary
    displayMonthSummary(monthData, startDate) {
        const container = document.getElementById('historyContainer');
        
        // Calculate summary statistics
        const totalDays = monthData.length;
        const totalPoints = monthData.reduce((sum, day) => sum + (day.data.points || 0), 0);
        const averagePoints = totalDays > 0 ? Math.round(totalPoints / totalDays) : 0;
        const trainingDays = monthData.filter(day => day.data.training).length;
        const savedDays = monthData.filter(day => day.data.saved).length;
        
        // Calculate averages
        const avgWeight = this.calculateAverage(monthData, 'weight');
        const avgCardio = this.calculateAverage(monthData, 'cardio');
        const avgProtein = this.calculateAverage(monthData, 'protein');
        const avgWater = this.calculateAverage(monthData, 'water');
        const avgSleep = this.calculateAverage(monthData, 'sleep');
        
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'card';
        summaryDiv.style.marginBottom = '24px';
        
        summaryDiv.innerHTML = `
            <h3 class="card-title">📊 ${startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} Summary</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 20px;">
                <div style="text-align: center; padding: 12px; background: var(--background-color); border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${totalDays}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Days Logged</div>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--background-color); border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--success-color);">${totalPoints}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Total Points</div>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--background-color); border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--warning-color);">${averagePoints}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Avg Points/Day</div>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--background-color); border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${trainingDays}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Training Days</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;">
                <div style="text-align: center; padding: 8px; background: var(--background-color); border-radius: 8px;">
                    <div style="font-weight: 600; color: var(--primary-color);">${avgWeight}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Avg Weight</div>
                </div>
                <div style="text-align: center; padding: 8px; background: var(--background-color); border-radius: 8px;">
                    <div style="font-weight: 600; color: var(--primary-color);">${avgCardio}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Avg Cardio</div>
                </div>
                <div style="text-align: center; padding: 8px; background: var(--background-color); border-radius: 8px;">
                    <div style="font-weight: 600; color: var(--primary-color);">${avgProtein}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Avg Protein</div>
                </div>
                <div style="text-align: center; padding: 8px; background: var(--background-color); border-radius: 8px;">
                    <div style="font-weight: 600; color: var(--primary-color);">${avgWater}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Avg Water</div>
                </div>
                <div style="text-align: center; padding: 8px; background: var(--background-color); border-radius: 8px;">
                    <div style="font-weight: 600; color: var(--primary-color);">${avgSleep}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Avg Sleep</div>
                </div>
            </div>
        `;
        
        container.insertBefore(summaryDiv, container.firstChild);
    },

    // Calculate average for a metric
    calculateAverage(data, metric) {
        const values = data.map(day => day.data[metric]).filter(val => val != null && val !== '');
        if (values.length === 0) return '-';
        
        const sum = values.reduce((total, val) => total + parseFloat(val), 0);
        const avg = sum / values.length;
        
        // Format based on metric type
        if (metric === 'weight' || metric === 'water') {
            return avg.toFixed(1);
        } else {
            return Math.round(avg);
        }
    }
};
