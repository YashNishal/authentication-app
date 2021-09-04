//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require("mongoose");
const app = express();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized : true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");


const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId : String,
    secret : String
});

userSchema.plugin(passportLocalMongoose, {username : false});
userSchema.plugin(findOrCreate);

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());

//
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
    callbackURL: "http://localhost:3000/auth/google/secrets",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id, username : profile.provider + profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/auth/google",
    passport.authenticate("google", { scope : ["profile"]})
);

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

app.get("/", (req,res)=> {
    res.render("home",{});
});

app.route("/login")
.get((req,res)=> {
    res.render("login");
})
.post( (req, res) => {
    const user = new User({
        username : req.body.username,
        password : req.body.password
    });
    
    req.login(user, (er) => {
        if(er) {
            console.log(er);
        } else {
            passport.authenticate("local")(req,res, function(){
                console.log(user,101);
                res.redirect("/secrets");
            });
        }
    });
});


app.route("/register")
.get((req,res)=> {
    res.render("register");
})
.post( (req, res) => {

    User.register({username : req.body.username} , req.body.password , (er,user) => {
        if(er) {
            console.log("Error in registering.",err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req,res, function(){
                console.log(user,101);
                res.redirect("/secrets");
            });
        }
    });
});


app.get("/secrets", (req,res) => {
    User.find({"secret" : {$ne : null}}, (er, result) => {
        if(er) {
            console.log(er);
            return;
        }
        if(result) {
            res.render("secrets", { usersWithSecrets : result});
        } else {
            console.log("Error ");
            res.redirect("home");
        }
    });
});



app.route("/submit")
.get( (req,res)=> {
    if( req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})
.post( (req,res) => {
    const submittedSecret = req.body.secret;
    User.findById(req.user.id, (er, foundUser) => {
        if(er) {
            console.log(er);
            return;
        }
        if(foundUser) {
            foundUser.secret = submittedSecret;
            foundUser.save( () => {
                res.redirect("/secrets");
            });
        }
    });

});



app.route("/logout")
.get( (req, res)=> {
    req.logOut();
    res.redirect("/");
});


app.listen(3000, () => {
  console.log(`Server started on port 3000`);
});