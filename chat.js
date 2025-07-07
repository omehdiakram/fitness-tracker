// Chat Module
window.chat = {
    isListening: false,

    // Setup chat listeners
    setupChatListener() {
        if (!database || this.isListening) return;
        
        this.isListening = true;
        
        // Listen for new messages
        database.ref('chat').limitToLast(50).on('child_added', (snapshot) => {
            const message = snapshot.val();
            this.displayChatMessage(message);
        });
        
        // Listen for online users count
        database.ref('users').on('value', (snapshot) => {
            if (snapshot.exists()) {
                const users = snapshot.val();
                const onlineCount = Object.values(users).filter(user => user.isOnline).length;
                document.getElementById('onlineCount').textContent = onlineCount;
            }
        });
        
        // Setup chat input event listener
        this.setupChatInput();
    },

    // Setup chat input
    setupChatInput() {
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');
        
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Auto-resize textarea
            chatInput.addEventListener('input', () => {
                chatInput.style.height = 'auto';
                chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
            });
        }
        
        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
        }
    },

    // Display chat message
    displayChatMessage(message) {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        const messageDiv = document.createElement('div');
        
        const isOwnMessage = message.uid === (currentUser ? currentUser.uid : null);
        messageDiv.className = `chat-message ${isOwnMessage ? 'own' : 'other'}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Create message content
        let messageContent = `<div>${this.formatMessageText(message.text)}</div>`;
        
        // Add author for other messages
        if (!isOwnMessage) {
            messageContent = `<div class="chat-message-author">${message.nickname || message.name}</div>` + messageContent;
        }
        
        // Add timestamp
        messageContent += `<div class="chat-message-time">${time}</div>`;
        
        messageDiv.innerHTML = messageContent;
        
        container.appendChild(messageDiv);
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
        
        // Remove old messages if too many
        while (container.children.length > 100) {
            container.removeChild(container.firstChild);
        }
    },

    // Format message text (basic emoji and link support)
    formatMessageText(text) {
        // Escape HTML
        const div = document.createElement('div');
        div.textContent = text;
        let escaped = div.innerHTML;
        
        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        escaped = escaped.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        // Convert @mentions to highlights
        const mentionRegex = /@(\w+)/g;
        escaped = escaped.replace(mentionRegex, '<span style="color: var(--primary-color); font-weight: 600;">@$1</span>');
        
        return escaped;
    },

    // Send message
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');
        
        if (!input || !sendButton) return;
        
        const text = input.value.trim();
        
        if (!text || !currentUser || !database) return;
        
        // Disable send button temporarily
        sendButton.disabled = true;
        
        try {
            const message = {
                uid: currentUser.uid,
                name: dashboard.userData.name || currentUser.displayName || 'User',
                nickname: dashboard.userData.nickname || 'Challenger',
                text: text,
                timestamp: new Date().toISOString()
            };
            
            await database.ref('chat').push(message);
            
            // Clear input
            input.value = '';
            input.style.height = 'auto';
            
            // Award points for engagement (max 3 messages per day)
            await this.awardChatPoints();
            
        } catch (error) {
            console.error('Error sending message:', error);
            ui.showNotification('Error sending message: ' + error.message, 'error');
        } finally {
            sendButton.disabled = false;
        }
    },

    // Award points for chat engagement
    async awardChatPoints() {
        if (!currentUser || !database) return;
        
        const today = new Date().toDateString();
        
        try {
            // Check how many messages sent today
            const snapshot = await database.ref(`users/${currentUser.uid}/dailyMetrics/${today}/chatMessages`).once('value');
            const currentCount = snapshot.val() || 0;
            
            if (currentCount < 3) {
                const newCount = currentCount + 1;
                await database.ref(`users/${currentUser.uid}/dailyMetrics/${today}/chatMessages`).set(newCount);
                
                // Award 2 points per message (max 6 points per day)
                await database.ref(`users/${currentUser.uid}/score`).transaction((score) => {
                    return (score || 0) + 2;
                });
                
                ui.showNotification('Message sent! +2 points for engagement! 💬', 'success');
            }
        } catch (error) {
            console.error('Error awarding chat points:', error);
        }
    },

    // Load chat history
    async loadChatHistory() {
        if (!database) return;
        
        try {
            const snapshot = await database.ref('chat').limitToLast(50).once('value');
            const container = document.getElementById('chatMessages');
            
            if (container) {
                container.innerHTML = '';
            }
            
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const message = child.val();
                    this.displayChatMessage(message);
                });
            } else {
                if (container) {
                    container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">Be the first to start the conversation! 💬</div>';
                }
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    },

    // Clear chat listeners
    clearListeners() {
        if (database && this.isListening) {
            database.ref('chat').off();
            database.ref('users').off();
            this.isListening = false;
        }
    }
};
