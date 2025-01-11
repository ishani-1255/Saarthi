if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const axios = require("axios");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const multer = require("multer");
const session = require("express-session");
const bodyParser = require("body-parser");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { isLoggedIn } = require("./middleware.js");
const User = require("./model/user.js");
const Profile = require("./model/profile.js");

const app = express();
const dbUrl = process.env.ATLASDB_URL;
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
app.locals.AppName = "Saarthi";

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Configure session store
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: { secret: process.env.SECRET },
  touchAfter: 24 * 60 * 60,
});
store.on("error", (error) => {
  console.error("Error in MONGO SESSION STORE:", error);
});

// Session options
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

// Middleware setup
app.use(session(sessionOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to make user data available in templates
app.use((req, res, next) => {
  res.locals.currUser = req.user;
  next();
});

// Connect to the database
async function connectDB() {
  try {
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
}

connectDB();

// Error handling utility
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Utility for file to generative part
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType,
    },
  };
}

// Routes
app.get("/index", isLoggedIn, (req, res) => res.render("chat.ejs"));
app.get("/home", isLoggedIn, (req, res) => res.render("home.ejs"));
app.get("/about", isLoggedIn, (req, res) => res.render("about.ejs"));
app.get("/contact", isLoggedIn, (req, res) => res.render("contact.ejs"));
app.get("/team", isLoggedIn, (req, res) => res.render("team.ejs"));
app.get("/testimonial", isLoggedIn, (req, res) =>
  res.render("testimonial.ejs")
);
app.get("/courses", isLoggedIn, (req, res) => res.render("courses.ejs"));
app.get("/form", isLoggedIn, (req, res) => res.render("form.ejs"));
app.get("/search", isLoggedIn, (req, res) => res.render("search.ejs"));
app.get("/syllabus", isLoggedIn, (req, res) => res.render("syllabus.ejs"));
app.get("/ask", isLoggedIn, (req, res) => res.render("ask.ejs"));
app.get("/chat", isLoggedIn, (req, res) => res.render("chat.ejs"));
app.get("/main", (req, res) => res.render("main.ejs"));
app.get("/login", (req, res) => res.render("login.ejs"));
app.get("/signup", (req, res) => res.render("signup.ejs"));
app.get("/grading", isLoggedIn, (req, res) => res.render("grading.ejs"));
app.get("/practice", isLoggedIn, (req, res) => {res.render("practice.ejs");
});

app.post("/practice", async (req, res) => {
  try {
    const { topic } = req.body;
    const generatedQuiz = await quizGenerator(topic);
    // Log the raw generated quiz

    // Attempt to parse the generated quiz string into an object
    const quiz = JSON.parse(generatedQuiz);
    req.session.quiz = quiz; // Store the generated quiz in the session

    res.render("quiz.ejs", { quiz }); // Render the quiz page with the generated quiz
  } catch (err) {
    console.error("Error generating quiz:", err);
    res.status(500).send("Error generating quiz. Please try again.");
  }
});

app.post("/submit-quiz", (req, res) => {
  const userAnswers = req.body.userAnswers;
  const quiz = req.session.quiz;

  if (!quiz) {
    console.error("Quiz not found in session");
    return res.status(400).json({ error: "Quiz not found in session." });
  }

  let correctCount = 0;
  const results = quiz.questions.map((question, index) => {
    const correctAnswer = question.correctAnswer;
    const userAnswer = userAnswers[`q${index}`];
    const isCorrect = userAnswer === correctAnswer;
    if (isCorrect) correctCount++;
    return {
      question: question.question,
      userAnswer,
      correctAnswer,
      isCorrect,
    };
  });

  res.json({
    correctCount,
    totalQuestions: quiz.questions.length,
    results,
  });
});

async function quizGenerator(topic) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `Based on the topic of ${topic} in the context of Engineering, create a multiple-choice quiz with 10 questions. Please format the response only in JSON (no extra things) with the following structure:
{
  "title": "MCQ Quiz on ${topic}",
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Correct answer text here"
    },
    {
      "question": "Next question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Correct answer text here"
    }
    // Repeat for all 10 questions
  ]
}
Make sure that:
- Strictly Do not include any preamble.
- Each question has 4 answer options.
- Provide the correct answer for each question under "correctAnswer".
`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  return text;
}


// Login route
app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login", failure: true }),
  (req, res) => {
    const { username } = req.body;
    req.session.user = { username };
    res.redirect("/user/home");
  }
);

// Signup route
app.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { username, email, phone, password } = req.body;
    req.session.user = { username, email, phone };
    const newUser = new User({ username, email, phone });
    await User.register(newUser, password);
    const newProfile = new Profile({ user: newUser._id, gender: "", bio: "" });
    await newProfile.save();
    res.redirect("/login");
  })
);

// Syllabus generation route
app.post(
  "/syllabus",
  isLoggedIn,
  asyncHandler(async (req, res) => {
    const { std, subject } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Generate the syllabus of ${std} for the subject ${subject} based on the current National Educational Policy.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.render("syl.ejs", { result: response.text() });
  })
);

// Chat route
// app.post(
//   "/chat",
//   isLoggedIn,
//   asyncHandler(async (req, res) => {
//     const userInput = req.body.message;
//     const model = genAI.getGenerativeModel({ model: "gemini-pro" });
//     const result = await model.generateContent(userInput);
//     const response = await result.response;
//     res.json({ message: response.text() });
//   })
// );

app.post("/chat", async (req, res) => {
  const userMessage = req.body.user_input;

  if (!userMessage) {
    return res.status(400).json({ error: "user_input is required" });
  }

  try {
    // Send user input to Python chatbot
    const pythonResponse = await axios.post("http://localhost:8000/chat", {
      user_input: userMessage,
    });
    const botReply =
      pythonResponse.data.bot_reply || "No response from the chatbot.";

    // Send bot's reply back to the frontend
    res.json({ bot_reply: botReply });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ error: "Error communicating with the Python chatbot." });
  }
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  console.log("Uploaded file URL:", fileUrl); // Log downloadable link

  // Send response to the frontend
  res.json({ message: "File uploaded successfully", fileUrl });
});

// Form submission route
app.post(
  "/form",
  isLoggedIn,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const imageParts = [
      {
        inlineData: {
          data: fs.readFileSync(req.file.path).toString("base64"),
          mimeType: "image/jpeg",
        },
      },
    ];
    const result = await model.generateContent(imageParts);
    const response = await result.response;
    res.json({ result: response.text() });
  })
);

// Logout route
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return next(err);
    }
    res.redirect("/main");
  });
});

// Catch-all route
app.all("*", (req, res) => {
  res.redirect("/index");
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).send("Internal Server Error");
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
