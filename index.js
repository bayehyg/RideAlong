const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
require('dotenv').config();

const app = express();
const port = 3000; // Choose your desired port
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("trust proxy", 1);
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());

const uri = `mongodb+srv://getanehyonatan:${process.env.MONGO_PASS}@cluster0.vycanqv.mongodb.net/?retryWrites=true&w=majority`;

mongoose.connect(uri);


const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String,
    secret: String
  });
  
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

const routeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  routeGeoJSON: {
    type: {
      type: String,
      enum: ['LineString'], 
      required: true
    },
    coordinates: {
      type: [[[Number]]],
      required: true
    }
  },
});

routeSchema.index({ routeGeoJSON: '2dsphere' }); 

const Route = mongoose.model('Route', routeSchema);

const driverSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  name: String,
  vehicle: String,
  schedule: [String],
  routes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }],
  
});

const Driver = mongoose.model('Driver', driverSchema);


const db = mongoose.connection;

db.on('connected', () => {
  console.log('Connected to MongoDB Atlas');
});

db.on('error', (err) => {
  console.error(`Error connecting to MongoDB Atlas: ${err}`);
});

db.on('disconnected', () => {
  console.log('Disconnected from MongoDB Atlas');
});

process.on('SIGINT', () => {
  db.close(() => {
    console.log('MongoDB Atlas connection closed');
    process.exit(0);
  });
});
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/ridealong",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Define a route for the login page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/login.html'); // Change the path to your login page HTML file
});

app.get("/auth/google", 
    passport.authenticate('google', { scope: ['profile'] }, (err, user) => {
        if(err) res.redirect("/");
    })
);

app.get("/auth/google/ridealong", 
  passport.authenticate('google', { failureRedirect: "/" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.sendFile("./views/driver.html");
  });

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

app.get("/requestride", (req, res) => {
  
});

app.post("/postroute", (req, res) => {
  if (req.isAuthenticated()){

  }else{
    res.redirect("/");
  }
});
// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
