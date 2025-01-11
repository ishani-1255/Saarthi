if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
  }
  
  const cloudinary = require("cloudinary").v2;
  const express = require("express");
  const { spawn } = require('child_process'); 
  const app = express();
  const fs = require("fs");
  const mongoose = require("mongoose");
  const path = require("path");
  const methodOverride = require("method-override");
  const ejsMate = require("ejs-mate");
  const User = require("./model/user.js");
  const Profile = require("./model/profile.js");
  
  const session = require("express-session");
  const busboy = require('busboy');
  const axios = require('axios');
  
  const bodyParser = require("body-parser");
  const MongoStore = require("connect-mongo");
  const LocalStrategy = require("passport-local");
  const passport = require("passport");
  const flash = require("connect-flash");
//   const { isLoggedIn } = require("./middleware.js");
  const multer = require("multer");
  
  const dbUrl = process.env.ATLASDB_URL;
  // const { storage } = require("./cloudConfig.js");
  if (dbUrl) {
    console.log("DB URL is set");
  }
  
  app.locals.AppName = 'Saarthi';
  
  async function extractImage(url) {
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer'
      });
      return response.data;
    } catch (error) {
      console.error('Error extracting image:', error);
      throw error;
    }
  }
  
  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  });
  
  const upload = multer({ 
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        // Only allow PDF files
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
  });
  
  const upload = multer({ storage });
  
  const store = MongoStore.create({
    mongoUrl: process.env.ATLASDB_URL,
    crypto: {
      secret: process.env.SECRET,
    },
    touchAfter: 24 * 60 * 60,
  });
  
  store.on("error", (error) => {
    console.log("Error in MONGO SESSION STORE: ", error);
  });
  
  const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  };
  
  app.use(session(sessionOptions));
  app.use(flash());
  
  app.use(bodyParser.urlencoded({ extended: true }));
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "/views"));
  app.use(express.static(path.join(__dirname, "public")));
  app.use("public/images/", express.static("./public/images"));
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride("_method"));
  app.engine("ejs", ejsMate);
  app.use(express.json());
  
  async function main() {
    await mongoose.connect(process.env.ATLASDB_URL);
  }
  
  main()
    .then(() => {
      console.log("Connection Succeeded");
    })
    .catch((err) => console.log(err));
  
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStrategy(User.authenticate()));
  
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
  
  app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
  });
  
  let port = 8080;
  app.listen(port, () => {
    console.log("listening to the port " + port);
  });
  
  app.get("/chat", (req, res) => {
    res.render("chat");
  } );

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