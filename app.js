//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require("mongoose");
const app = express();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

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
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




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


app.route("/secrets")
.get( (req,res) => {
    if( req.isAuthenticated()) {
        console.log("Authentication completed!");
        res.render("secrets");
    } else {
        console.log("Authentication failed");
        res.redirect("/login");
    }
});




app.route("/logout")
.get( (req, res)=> {
    req.logOut();
    res.redirect("/");
});


app.listen(3000, () => {
  console.log(`Server started on port 3000`);
});