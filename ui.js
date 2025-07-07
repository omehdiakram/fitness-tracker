// UI Module
const ui = {
    // Show authentication screen
    showAuthScreen() {
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    },

    // Show main application
    showMainApp() {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        this.updateTodayDate();
        this.updateGlobalProgress();
    },

    // Update today's date display
    updateTodayDate() {
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const todayElement = document.getElementById('todayDate');
        if (todayElement) {
            todayElement.textContent = today.toLocaleDateString('en-US', options);
        }
    },

    // Update global challenge progress
    updateGlobalProgress() {
        const startDate = new Date('2025-06-01');
        const endDate = new Date('2026-06-01');
        const currentDate = new Date();
        
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const completedDays = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));
        const remainingDays = Math.max(0, totalDays - completedDays);
        
        const percentage = Math.max(0, Math.min(100, (completedDays / totalDays) * 100));
        
        const progressElement = document.getElementById('globalProgress');
        const remainingElement = document.getElementById('daysRemaining');
        
        if (progressElement) {
            progressElement.textContent = `Progress: ${percentage.toFixed(1)}%`;
        }
        if (remainingElement) {
            remainingElement.textContent = `Days left: ${remainingDays}`;
        }
    },

    // Show specific tab
    showTab(tabName) {
        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Find and activate the clicked tab
        const clickedTab = event ? event.target : document.querySelector(`[onclick="ui.showTab('${tabName}')"]`);
        if (clickedTab) {
            clickedTab.classList.add('active');
        }
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Load tab-specific data
        this.handleTabSwitch(tabName);
    },

    // Handle tab-specific loading
    handleTabSwitch(tabName) {
        switch (tabName) {
            case 'mealprep':
                mealPrep.loadMealPhotos();
                break;
            case 'chat':
                if (!chat.isListening) {
                    chat.setupChatListener();
                }
                chat.loadChatHistory();
                break;
            case 'leaderboard':
                dashboard.loadLeaderboard();
                break;
            case 'history':
                // History tab is loaded on demand when user selects date/month
                break;
            case 'dashboard':
                dashboard.loadTodayData();
                break;
        }
    },

    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove notification
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    },

    // Initialize modal close handlers
    initModals() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
            }
        });

        // Close modal with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal:not(.hidden)');
                modals.forEach(modal => modal.classList.add('hidden'));
            }
        });
    },

    // Setup form validation
    setupFormValidation() {
        // Email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value && !this.isValidEmail(input.value)) {
                    input.style.borderColor = 'var(--error-color)';
                } else {
                    input.style.borderColor = '';
                }
            });
        });

        // Password validation
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.id === 'registerPassword') {
                    if (input.value.length > 0 && input.value.length < 6) {
                        input.style.borderColor = 'var(--error-color)';
                    } else {
                        input.style.borderColor = '';
                    }
                }
            });
        });
    },

    // Email validation helper
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Setup responsive navigation
    setupResponsiveNav() {
        const navTabs = document.querySelector('.nav-tabs');
        if (!navTabs) return;

        // Add touch scrolling for mobile
        if ('ontouchstart' in window) {
            navTabs.style.overflowX = 'auto';
            navTabs.style.scrollBehavior = 'smooth';
        }
    },

    // Setup accessibility features
    setupAccessibility() {
        // Add keyboard navigation for custom elements
        const clickableElements = document.querySelectorAll('[onclick], .metric-card, .meal-upload');
        
        clickableElements.forEach(element => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
            
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    element.click();
                }
            });
        });

        // Improve focus visibility
        const style = document.createElement('style');
        style.textContent = `
            *:focus {
                outline: 2px solid var(--primary-color);
                outline-offset: 2px;
            }
            
            .btn:focus,
            .form-input:focus,
            .nav-tab:focus {
                outline: none;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
            }
        `;
        document.head.appendChild(style);
    },

    // Setup page visibility handling
    setupPageVisibility() {
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
    },

    // Initialize all UI components
    init() {
        this.initModals();
        this.setupFormValidation();
        this.setupResponsiveNav();
        this.setupAccessibility();
        this.setupPageVisibility();
        
        // Initialize other modules
        mealPrep.init();
        dashboard.setupMetricInputs();
        
        console.log('✅ UI initialized');
    }
};
