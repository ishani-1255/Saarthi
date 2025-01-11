const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const app = express();

// Middleware to parse JSON and serve static files
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "public")));
app.use("public/images/", express.static("./public/images"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.json());

// Route to serve the chatbot interface (GET request)
app.get('/chat', (req, res) => {
    res.render('chat');
});

// Route to handle chatbot interaction (POST request)
app.post('/chat', async (req, res) => {
    const userMessage = req.body.user_input;

    if (!userMessage) {
        return res.status(400).json({ error: 'user_input is required' });
    }

    try {
        // Send user input to Python chatbot
        const pythonResponse = await axios.post('http://localhost:8000/chat', { user_input: userMessage });
        const botReply = pythonResponse.data.bot_reply || 'No response from the chatbot.';

        // Send bot's reply back to the frontend
        res.json({ bot_reply: botReply });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error communicating with the Python chatbot.' });
    }
});

// Route to reset the chatbot conversation
app.post('/reset', async (req, res) => {
    try {
        // Send a reset request to Python chatbot
        await axios.post('http://localhost:8000/reset');
        res.json({ message: 'Conversation reset successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error resetting the conversation.' });
    }
});

// Start the Node.js server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Node.js server running on http://localhost:${PORT}`);
});
