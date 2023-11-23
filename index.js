const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const cors = require('cors');
require('dotenv').config();


const app = express();
const port = 3000; // Choose your desired port
app.use(express.static('views'));
app.set('view engine', 'ejs');
app.use(cors());
app.use(bodyParser.json());
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
    name: String,
    email: String,
    googleId: String
  });
  
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

const routeSchema = new mongoose.Schema({
  name: String,
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  start: {
    type: [Number],
    required: true
  },
  end: {
    type: [Number],
    required: true
  }
});
routeSchema.index({ startGeoJSON: '2dsphear'});
routeSchema.index({endGeoJSON: '2dsphear' });

const Route = mongoose.model('Route', routeSchema);

const driverSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  name: String,
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

passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/ridealong",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ name: profile.displayName, googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/', (req, res) => {
    res.render("login");
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
    res.redirect("/logout");
  });

app.get("/logout", (req, res) => {
    res.render("driver");
});

app.get("/requestride", (req, res) => {
  const startc = [req.query.slng, req.query.slat];
  const endc = [req.query.elng, req.query.elat];
  Route.find({
    $and: [
      {
        start: {
          $geoWithin: {
            $centerSphere: [ startc, 1000 ]
          }
        }
      },
      {
        end: {
          $geoWithin: {
            $centerSphere: [ endc, 1000 ]
          }
        }
      }
    ]
  }).then(results => {
    console.log(results); // This will log the matched routes
    res.send(results);
  }).catch(error => {
    console.error(error); // Log any errors that occur during the query
    res.sendStatus(500);
  });
});

app.post("/postroute", async (req, res) => {
  console.log(req.body);
  const newRoute = new Route({
    name: 'yonatan',
    driver: '655a6fc1ceac5ea7046d5e4c',
    start: [req.body.start.lng, req.body.start.lat],
    end: [req.body.end.lng, req.body.end.lat]
  });
  console.log(newRoute);
  try {
    const savedRoute = await newRoute.save();

    let driver = await Driver.findById('655a6fc1ceac5ea7046d5e4c');
    if (!driver) {
      driver = new Driver({
        _id: '655a6fc1ceac5ea7046d5e4c',
        routes: [savedRoute._id],
      });
    } else {
      driver.routes.push(savedRoute._id);
    }
    await driver.save();

    res.status(200).json({ message: 'Route created successfully', route: savedRoute });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating route' });
  }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
