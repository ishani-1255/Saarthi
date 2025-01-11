const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 5400; // Port for the Node.js server
const PYTHON_SERVER_URL = "http://localhost:8000/chat"; // URL of the Python chatbot backend

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from the "public" directory

// Chat API endpoint
app.post("/chat", async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Send the user message to the Python backend
        const response = await axios.post(PYTHON_SERVER_URL, { user_input: userMessage });

        // Return the chatbot's response to the frontend
        const botReply = response.data.bot_reply;
        res.json({ message: botReply });
    } catch (error) {
        console.error("Error communicating with the Python backend:", error.message);
        res.status(500).json({ error: "Failed to communicate with chatbot" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Node.js server is running on http://localhost:${PORT}`);
});
