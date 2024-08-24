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
const fs = require('fs');
const https = require('https');
const http = require('http');
const app = express();
const port = 443;
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

// TODO: uncomment this
// const hostName = 'rideealong.co';
// const httpsOptions = {
//   cert: fs.readFileSync('./cert.crt'),
//   ca: fs.readFileSync('./bundle.ca-bundle'),
//   key: fs.readFileSync('./pvKey.key')
// };
//const server = https.createServer(httpsOptions, app);
const server = http.createServer(app);
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
  },
  passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  time: {
    type: Date,
    required: true
  }
});
routeSchema.index({ start: '2d'});
routeSchema.index({ end: '2d' });

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
    callbackURL: "https://rideealong.co/auth/google/ridealong",
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
app.get('', (req, res) => {
  res.render("login");
});
app.get('/', (req, res) => {
  res.render("login");
});
app.get("/orders", (req,res) => {
  
  res.render("rides", {key: process.env.MAPS_API})
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

app.get('/orders/postedRides', async (req, res) => {
  // if (!req.isAuthenticated()) {
  //   return res.status(401).json({ message: 'Unauthorized' });
  // }
  req.user = {
    _id: '6561eb39658864b2b2a8686f'  // TODO: Remove this
  };
  const userId = req.user._id;

  try {
    const postedRides = await Route.find({ driver: userId })
      .populate('passengers', 'name driverPicture'); 
    res.status(200).json(postedRides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching posted rides' });
  }
});

app.get('/orders/reservedRides', async (req, res) => {
  // if (!req.isAuthenticated()) {
  //   return res.status(401).json({ message: 'Unauthorized' });
  // }
  
  req.user = {
    _id: '6561eb39658864b2b2a8686f'  // TODO: Remove this
  };
  const userId = req.user._id;

  try {
    // TODO: change the hardcoded userid to {userId}
    const reservedRides = await Route.find({ passengers: userId })
      .populate('driver', 'fullName profilePicture'); // Assuming 'fullName' and 'profilePicture' are the correct fields in User model
    res.status(200).json(reservedRides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching reserved rides' });
  }
});

app.delete('/route/:id', async (req, res) => {
  // if (!req.isAuthenticated()) {
  //   return res.status(401).json({ message: 'Unauthorized' });
  // }

  const routeId = req.params.id;

  try {
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    if (route.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this route' });
    }
    await Route.findByIdAndDelete(routeId);
    await Driver.findByIdAndUpdate(req.user._id, { $pull: { routes: routeId } });

    res.status(200).json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting route' });
  }
});

app.post('/orders/cancelReservation/:id', async (req, res) => {
  // if (!req.isAuthenticated()) {
  //   return res.status(401).json({ message: 'Unauthorized' });
  // }

  req.user = {
    _id: '6561eb39658864b2b2a8686f'  // TODO: Remove this
  };
  const routeId = req.params.id;

  try {
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    if (!route.passengers.includes(req.user._id)) {
      return res.status(400).json({ message: 'User has not reserved this route' });
    }

    route.passengers.pull(req.user._id);
    await route.save();

    res.status(200).json({ message: 'Ride reservation canceled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error canceling ride reservation' });
  }
});




app.get("/driver", (req, res) => {
  if(req.isAuthenticated()){
    res.render("driver", {name: req.user.username, picture: req.user.picture, key: process.env.MAPS_API});
  }else {
    res.redirect("/");
  }
});
app.post('/reserveRoute', async (req, res) => {
  // if (!req.isAuthenticated()) {
  //   return res.status(401).json({ message: 'Unauthorized' });
  // }

  req.user = {
    _id: '6561eb39658864b2b2a8686f'  // TODO: // TODO: Remove this
  };
  const { routeId } = req.body; 

  try {
    
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    
    if (route.passengers.includes(req.user._id)) {
      return res.status(400).json({ message: 'User already reserved this route' });
    }

    
    route.passengers.push(req.user._id);
    
   
    await route.save();

    res.status(200).json({ message: 'Ride reserved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error reserving ride' });
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
      end: [req.body.end.lng, req.body.end.lat],
      time: new Date(req.body.time)
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

// TODO: change to port variable
server.listen(3000, () => {
  console.log(`Server running at http://localhost:3000/`);
  //console.log(`Server running at http://${hostName}:${port}/`);
});
