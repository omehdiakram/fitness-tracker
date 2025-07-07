// Meal Prep Module
window.mealPrep = {
    selectedFile: null,

    // Initialize meal upload functionality
    init() {
        this.setupUploadArea();
        this.setupModal();
    },

    // Setup main upload area
    setupUploadArea() {
        const uploadArea = document.getElementById('mealUpload');
        const fileInput = document.getElementById('mealFileInput');

        if (!uploadArea || !fileInput) return;

        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    },

    // Setup modal functionality
    setupModal() {
        const modalUploadArea = document.getElementById('mealUploadArea');
        const modalFileInput = document.getElementById('modalMealInput');

        if (!modalUploadArea || !modalFileInput) return;

        modalUploadArea.addEventListener('click', () => modalFileInput.click());
        
        modalUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            modalUploadArea.classList.add('drag-over');
        });

        modalUploadArea.addEventListener('dragleave', () => {
            modalUploadArea.classList.remove('drag-over');
        });

        modalUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            modalUploadArea.classList.remove('drag-over');
            this.handleModalFiles(e.dataTransfer.files);
        });

        modalFileInput.addEventListener('change', (e) => {
            this.handleModalFiles(e.target.files);
        });
    },

    // Handle files from main upload area
    async handleFiles(files) {
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                await this.uploadMealPhoto(file);
            }
        }
    },

    // Handle files from modal
    handleModalFiles(files) {
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            this.selectedFile = files[0];
            document.getElementById('mealUploadArea').innerHTML = `
                <div class="upload-icon">✅</div>
                <div class="upload-text">File selected: ${files[0].name}</div>
            `;
        }
    },

    // Show upload modal
    showUploadModal() {
        document.getElementById('mealUploadModal').classList.remove('hidden');
        this.selectedFile = null;
        document.getElementById('mealDescription').value = '';
        document.getElementById('mealUploadArea').innerHTML = `
            <div class="upload-icon">📷</div>
            <div class="upload-text">Click to upload or drag & drop</div>
        `;
    },

    // Close upload modal
    closeUploadModal() {
        document.getElementById('mealUploadModal').classList.add('hidden');
        this.selectedFile = null;
    },

    // Upload from modal
    async uploadFromModal() {
        if (!this.selectedFile) {
            ui.showNotification('Please select a file first', 'error');
            return;
        }

        const description = document.getElementById('mealDescription').value.trim();
        await this.uploadMealPhoto(this.selectedFile, description);
        this.closeUploadModal();
    },

    // Upload meal photo
    async uploadMealPhoto(file, description = '') {
        if (!currentUser || !storage || !database) return;
        
        try {
            const timestamp = new Date().getTime();
            const fileName = `meals/${currentUser.uid}/${timestamp}_${file.name}`;
            const storageRef = storage.ref(fileName);
            
            ui.showNotification('Uploading photo... 📸', 'warning');
            
            // Upload file to storage
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            // Prepare photo data
            const photoData = {
                url: downloadURL,
                timestamp: timestamp,
                fileName: fileName,
                description: description,
                uploadDate: new Date().toISOString(),
                date: new Date().toDateString()
            };
            
            // Save to user's meal photos
            await database.ref(`users/${currentUser.uid}/mealPhotos/${timestamp}`).set(photoData);
            
            // Update daily meal prep count
            await this.updateDailyMealCount();
            
            // Award points for meal prep
            await database.ref(`users/${currentUser.uid}/score`).transaction((score) => {
                return (score || 0) + 5;
            });
            
            // Display the photo
            this.displayMealPhoto(photoData);
            ui.showNotification('Meal photo uploaded! +5 points! 🎉', 'success');
            
            // Update today's metrics
            dashboard.loadTodayData();
            
        } catch (error) {
            console.error('Error uploading photo:', error);
            ui.showNotification('Error uploading photo: ' + error.message, 'error');
        }
    },

    // Update daily meal count
    async updateDailyMealCount() {
        if (!currentUser || !database) return;
        
        const today = new Date().toDateString();
        
        try {
            // Count today's meal photos
            const snapshot = await database.ref(`users/${currentUser.uid}/mealPhotos`).once('value');
            let todayCount = 0;
            
            if (snapshot.exists()) {
                const photos = snapshot.val();
                todayCount = Object.values(photos).filter(photo => photo.date === today).length;
            }
            
            // Update daily metrics
            await database.ref(`users/${currentUser.uid}/dailyMetrics/${today}/mealPhotos`).set(todayCount);
            
        } catch (error) {
            console.error('Error updating meal count:', error);
        }
    },

    // Display meal photo
    displayMealPhoto(photoData) {
        const container = document.getElementById('mealPhotos');
        
        const photoDiv = document.createElement('div');
        photoDiv.className = 'meal-photo';
        photoDiv.innerHTML = `
            <img src="${photoData.url}" alt="Meal prep">
            <div class="meal-photo-info">
                ${photoData.description ? `<div>${photoData.description}</div>` : ''}
                <div>${new Date(photoData.uploadDate).toLocaleDateString()}</div>
            </div>
            <button class="delete-btn" onclick="mealPrep.deleteMealPhoto('${photoData.timestamp}', '${photoData.fileName}')">✕</button>
        `;
        
        container.prepend(photoDiv);
    },

    // Delete meal photo
    async deleteMealPhoto(timestamp, fileName) {
        if (!currentUser || !storage || !database) return;
        
        if (!confirm('Are you sure you want to delete this photo?')) {
            return;
        }
        
        try {
            // Delete from storage
            await storage.ref(fileName).delete();
            
            // Delete from database
            await database.ref(`users/${currentUser.uid}/mealPhotos/${timestamp}`).remove();
            
            // Remove points
            await database.ref(`users/${currentUser.uid}/score`).transaction((score) => {
                return Math.max(0, (score || 0) - 5);
            });
            
            // Update daily meal count
            await this.updateDailyMealCount();
            
            ui.showNotification('Photo deleted', 'warning');
            
            // Reload photos and today's data
            this.loadMealPhotos();
            dashboard.loadTodayData();
            
        } catch (error) {
            console.error('Error deleting photo:', error);
            ui.showNotification('Error deleting photo: ' + error.message, 'error');
        }
    },

    // Load all meal photos
    async loadMealPhotos() {
        if (!currentUser || !database) return;
        
        try {
            const snapshot = await database.ref(`users/${currentUser.uid}/mealPhotos`).once('value');
            const container = document.getElementById('mealPhotos');
            container.innerHTML = '';
            
            if (snapshot.exists()) {
                const photos = snapshot.val();
                const sortedPhotos = Object.values(photos).sort((a, b) => b.timestamp - a.timestamp);
                
                sortedPhotos.forEach(photo => {
                    this.displayMealPhoto(photo);
                });
            } else {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No meal photos yet. Start uploading to track your meal prep! 📸</p>';
            }
        } catch (error) {
            console.error('Error loading meal photos:', error);
        }
    },

    // Load meal photos for a specific date
    async loadMealPhotosForDate(date) {
        if (!currentUser || !database) return [];
        
        try {
            const snapshot = await database.ref(`users/${currentUser.uid}/mealPhotos`).once('value');
            
            if (snapshot.exists()) {
                const photos = snapshot.val();
                return Object.values(photos).filter(photo => photo.date === date);
            }
            
            return [];
        } catch (error) {
            console.error('Error loading meal photos for date:', error);
            return [];
        }
    }
};
