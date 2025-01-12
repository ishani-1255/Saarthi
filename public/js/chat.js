

const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const messages = document.getElementById('messages');
const loadingSpinner = document.getElementById('loading-spinner');

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = userInput.value;

    // Display user's message
    displayMessage(userMessage, 'user');

    // Show loading spinner
    loadingSpinner.style.display = 'flex';

    try {
        // Send user message to Node.js backend
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_input: userMessage })
        });

        const data = await response.json();

        // Hide loading spinner
        loadingSpinner.style.display = 'none';

        // Display bot's reply
        displayMessage(data.bot_reply, 'bot');
    } catch (error) {
        console.error(error);

        // Hide loading spinner
        loadingSpinner.style.display = 'none';

        displayMessage('Error communicating with the chatbot.', 'bot');
    }

    userInput.value = '';
});

function displayMessage(message, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.textContent = message;
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}
