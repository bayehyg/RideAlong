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
const nodemailer = require('nodemailer');
require('dotenv').config();


const app = express();
const port = 80; // Choose your desired port
app.use(express.static('views'));
app.set('view engine', 'ejs');
app.use(cors({origin: '*'}));
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
    picture: String,
    email: String,
    googleId: String
  });
  
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

const routeSchema = new mongoose.Schema({
  name: String,
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  driverPicture: String,
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
  picture: String,
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
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  service: 'gmail',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: 'ridealong.team.official@gmail.com',   
    pass: process.env.EMAIL_PASS
  },
  from: 'ridealong.team.official@gmail.com', 
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://52.10.199.239:80/auth/google/ridealong",
  },
   async function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    const user = await User.findOne({ googleId: profile.id });
    if (!user) {
      const newUser = new User({
        email: profile.emails[0].value,
        username: profile.name.givenName,
        name: profile.displayName,
        googleId: profile.id,
        picture: profile.photos[0].value
      });
      
      try {
        const savedUser = await newUser.save();

        ejs.renderFile('views/mail.ejs', {name: newUser.username}, (err, compiledHtml) => {
          if (err) {
            console.log('Error rendering template:', err);
          } else {
            // Email content
            const mailOptions = {
              from: 'Ride Along team<ridealong.team.official@gmail.com>', 
              to: savedUser.email, 
              subject: "Welcome To Ride Along" ,
              html: compiledHtml
            };
        
            // Send email
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('Error occurred:', error);
              } else {
                console.log('Email sent:', info.response);
              }
            });
          }
        });
        
        return cb(null, savedUser);
      } catch (error) {
        return cb(error);
      }
    } else {
      // User already exists, return the user
      return cb(null, user);
    }
    
    
  }
));

app.get('/', (req, res) => {
    res.render("login");
});

app.get("/auth/google", 
    passport.authenticate('google', { scope: ['profile', 'email'] }, (err, user) => {
        if(err) res.redirect("/");
    })
);

app.get("/auth/google/ridealong",
  passport.authenticate('google', { failureRedirect: "/" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/customer");
  });

app.get("/customer", (req, res) => {
  if(req.isAuthenticated()){
    res.render("customer", {name: req.user.name.split(" ")[0] , picture: req.user.picture, key: process.env.MAPS_API});
  } else {
    res.redirect("/");
  }
});

app.get("/driver", (req, res) => {
  if(req.isAuthenticated()){
    res.render("driver", {name: req.user.username, picture: req.user.picture, key: process.env.MAPS_API});
  }else {
    res.redirect("/");
  }
});

app.get("/requestride", (req, res) => {
  if(req.isAuthenticated()){
    const startc = [req.query.slng, req.query.slat];
    const endc = [req.query.elng, req.query.elat];
    Route.find({
      $and: [
        {
          start: {
            $geoWithin: {
              $centerSphere: [ startc, 500 ]
            }
          }
        },
        {
          end: {
            $geoWithin: {
              $centerSphere: [ endc, 250 ]
            }
          }
        }
      ]
    }).then(results => {
      console.log(results); 
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(200).json(results);
    }).catch(error => {
      console.error(error); 
      res.sendStatus(500);
    });
  }else{
    res.redirect("/");
  }

}
);

app.post("/postroute", async (req, res) => {
  if(req.isAuthenticated()){
    console.log(req.body);
    const newRoute = new Route({
      name: req.user.name,
      driver: req.user._id,
      driverPicture: req.user.picture,
      start: [req.body.start.lng, req.body.start.lat],
      end: [req.body.end.lng, req.body.end.lat]
    });
    console.log(newRoute);
    try {
      const savedRoute = await newRoute.save();
      let driver = await Driver.findById(req.user._id);
      if (!driver) {
        driver = new Driver({
          _id: req.user._id,
          picture: req.user.picture,
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
  }else{
    res.redirect("/");
  }
});

app.get("/logout", (req, res) => {
  req.logout(function(err) {
    if (err) { console.log(err); }
    res.redirect('/');
  });
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
