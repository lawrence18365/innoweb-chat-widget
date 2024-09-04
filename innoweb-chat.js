const chatWidget = document.getElementById('chat-widget');
const chatToggle = document.getElementById('chat-toggle');
const closeChat = document.getElementById('close-chat');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const typingIndicator = document.getElementById('typing-indicator');
const notification = document.getElementById('notification');
const chatSuggestions = document.getElementById('chat-suggestions');

let conversationHistory = [];

function toggleChat() {
    chatWidget.classList.toggle('open');
    if (chatWidget.classList.contains('open')) {
        userInput.focus();
    }
}

chatToggle.addEventListener('click', toggleChat);
closeChat.addEventListener('click', toggleChat);

function addMessage(message, isUser) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isUser ? 'user-message' : 'bot-message');
    messageElement.textContent = message;

    const timeElement = document.createElement('span');
    timeElement.classList.add('message-time');
    timeElement.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageElement.appendChild(timeElement);

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    conversationHistory.push({
        role: isUser ? 'user' : 'assistant',
        content: message
    });
}

function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

function showNotification(message, type) {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.opacity = 1;
    setTimeout(() => {
        notification.style.opacity = 0;
    }, 3000);
}

function addSuggestions(suggestions) {
    chatSuggestions.innerHTML = '';
    suggestions.forEach(suggestion => {
        const chip = document.createElement('div');
        chip.classList.add('suggestion-chip');
        chip.textContent = suggestion;
        chip.addEventListener('click', () => {
            userInput.value = suggestion;
            sendMessage();
        });
        chatSuggestions.appendChild(chip);
    });
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        addMessage(message, true);
        userInput.value = '';
        showTypingIndicator();
        try {
            const response = await fetch('https://hook.eu2.make.com/efn6cc5v2cg9ee9p8odj1l39v7vs0pk7', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message,
                    conversationHistory 
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.log('Response is not JSON, using as plain text');
                data = { reply: text };
            }

            hideTypingIndicator();

            if (data && (data.reply || data.Result)) {
                const botReply = data.reply || data.Result;
                addMessage(botReply, false);
                showNotification('Message sent successfully', 'success');

                // Add suggestions based on the bot's reply
                const suggestions = generateSuggestions(botReply);
                addSuggestions(suggestions);
            } else {
                console.log('Unexpected response structure:', data);
                addMessage('Received a response, but it was in an unexpected format.', false);
                showNotification('Error: Unexpected response format', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator();
            addMessage('Sorry, I couldn\'t process your request. Please try again.', false);
            showNotification('Error: Couldn\'t process request', 'error');
        }
    }
}

function generateSuggestions(botReply) {
    // This is a simple example. You can implement more sophisticated suggestion generation.
    const keywords = ['project', 'design', 'development', 'pricing', 'timeline'];
    return keywords.filter(keyword => botReply.toLowerCase().includes(keyword))
                   .map(keyword => `Tell me more about ${keyword}`);
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initial message from the chatbot
window.addEventListener('load', () => {
    setTimeout(() => {
        addMessage("Hi there! Welcome to InnoWeb Designs. What's the next project you're planning?", false);
        addSuggestions(['Website redesign', 'Mobile app development', 'E-commerce solution', 'Custom software']);
    }, 1000);
});
