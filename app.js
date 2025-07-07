// Main Application Entry Point
class FitSquadApp {
    constructor() {
        this.isInitialized = false;
        this.initializationAttempts = 0;
        this.maxAttempts = 3;
    }

    // Initialize the entire application
    async init() {
        try {
            console.log('🚀 Starting FitSquad Pro...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize UI first
            ui.init();
            
            // Initialize Firebase with retry logic
            await this.initializeFirebaseWithRetry();
            
            // Mark as initialized
            this.isInitialized = true;
            console.log('✅ FitSquad Pro initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize FitSquad Pro:', error);
            ui.showNotification('Failed to initialize app. Please refresh the page.', 'error');
        }
    }

    // Initialize Firebase with retry mechanism
    async initializeFirebaseWithRetry() {
        this.initializationAttempts++;
        
        try {
            console.log(`🔥 Firebase initialization attempt ${this.initializationAttempts}...`);
            
            // Check if Firebase SDK is loaded
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK not loaded');
            }

            // Initialize Firebase
            const success = await new Promise((resolve) => {
                setTimeout(() => {
                    resolve(initializeFirebase());
                }, 1000);
            });

            if (!success) {
                throw new Error('Firebase initialization returned false');
            }

            console.log('✅ Firebase initialized successfully');
            return true;
            
        } catch (error) {
            console.error(`❌ Firebase initialization attempt ${this.initializationAttempts} failed:`, error);
            
            if (this.initializationAttempts < this.maxAttempts) {
                console.log(`🔄 Retrying Firebase initialization in ${this.initializationAttempts * 2} seconds...`);
                await new Promise(resolve => setTimeout(resolve, this.initializationAttempts * 2000));
                return this.initializeFirebaseWithRetry();
            } else {
                throw new Error(`Firebase initialization failed after ${this.maxAttempts} attempts`);
            }
        }
    }

    // Handle application errors
    handleError(error, context = 'Unknown') {
        console.error(`❌ Error in ${context}:`, error);
        
        // Show user-friendly error message
        let message = 'An error occurred. Please try again.';
        
        if (error.message.includes('network')) {
            message = 'Network error. Please check your connection.';
        } else if (error.message.includes('permission')) {
            message = 'Permission denied. Please check your account access.';
        } else if (error.message.includes('Firebase')) {
            message = 'Connection error. Please refresh the page.';
        }
        
        ui.showNotification(message, 'error');
    }

    // Restart the application
    async restart() {
        console.log('🔄 Restarting FitSquad Pro...');
        
        try {
            // Clear existing listeners
            if (chat.isListening) {
                chat.clearListeners();
            }
            
            // Reset initialization state
            this.isInitialized = false;
            this.initializationAttempts = 0;
            
            // Reinitialize
            await this.init();
            
        } catch (error) {
            this.handleError(error, 'App Restart');
        }
    }
}

// Global app instance
const app = new FitSquadApp();

// Error handling for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    app.handleError(event.reason, 'Unhandled Promise');
    event.preventDefault();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    app.handleError(event.error, 'Global Error');
});

// Performance monitoring
const performanceMonitor = {
    startTime: Date.now(),
    
    logLoadTime() {
        const loadTime = Date.now() - this.startTime;
        console.log(`📊 App load time: ${loadTime}ms`);
        
        if (loadTime > 5000) {
            console.warn('⚠️ App load time is slower than expected');
        }
    },
    
    logMemoryUsage() {
        if (performance.memory) {
            const memory = performance.memory;
            console.log('📊 Memory usage:', {
                used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
                total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
                limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
            });
        }
    }
};

// Development helpers (only in development)
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (isDevelopment) {
    // Expose globals for debugging
    window.app = app;
    window.dashboard = dashboard;
    window.auth = auth;
    window.chat = chat;
    window.mealPrep = mealPrep;
    window.history = history;
    window.ui = ui;
    
    // Development console commands
    window.devTools = {
        restart: () => app.restart(),
        clearData: async () => {
            if (confirm('Clear all local data? This cannot be undone.')) {
                localStorage.clear();
                sessionStorage.clear();
                location.reload();
            }
        },
        getUser: () => currentUser,
        getUserData: () => dashboard.userData,
        getDailyData: () => dashboard.dailyData,
        testNotification: (message = 'Test notification', type = 'success') => {
            ui.showNotification(message, type);
        }
    };
    
    console.log('🛠️ Development mode enabled. Use window.devTools for debugging.');
}

// Initialize the application when page loads
window.addEventListener('load', () => {
    console.log('📱 Page loaded, initializing FitSquad Pro...');
    app.init().then(() => {
        performanceMonitor.logLoadTime();
        if (isDevelopment) {
            performanceMonitor.logMemoryUsage();
        }
    });
});

// Service worker registration (if available)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registered:', registration);
            })
            .catch((error) => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}

// App update notification
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        ui.showNotification('App updated! Refresh to see new features.', 'success');
    });
}

// Offline/online detection
window.addEventListener('online', () => {
    ui.showNotification('Back online! 🌐', 'success');
    if (currentUser && !app.isInitialized) {
        app.restart();
    }
});

window.addEventListener('offline', () => {
    ui.showNotification('You are offline. Some features may not work.', 'warning');
});

// Export for use in HTML
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { app, dashboard, auth, chat, mealPrep, history, ui };
}
