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

  const session = require("express-session");
  const busboy = require('busboy');
  const axios = require('axios');
  
  const bodyParser = require("body-parser");
  const MongoStore = require("connect-mongo");
  const LocalStrategy = require("passport-local");
  const passport = require("passport");
  const flash = require("connect-flash");
//   const { isLoggedIn } = require("./middleware.js");0
  const multer = require("multer");
  
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
  
  app.listen(3000, () => {
    console.log("Serving on port 3000");
  } );

  app.get("/", (req, res) => {
    res.render("chat");
  } );