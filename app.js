//jshint esversion:6
const express = require('express');
const ejs = require('ejs');
const mongoose = require("mongoose");
const app = express();
const encrypt = require("mongoose-encryption");
 
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser : true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// in real-life case we will add below string into a different file
// and will put that file in gitignore.
const secret = "This_is_secreat_string";
userSchema.plugin(encrypt, { secret : secret , encryptedFields : ['password']});


const User = mongoose.model("User",userSchema);


app.get("/", (req,res)=> {
    res.render("home",{});
});

app.route("/login")
.get((req,res)=> {
    res.render("login");
})
.post( (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email : username}, (er,foundUser) => {
        if(er) {
            console.log(er);
            return;
        }
        if(foundUser) {
            if(foundUser.password === password) {
                res.render("secrets");
            }
        }
    });
});


app.route("/register")
.get((req,res)=> {
    res.render("register",{});
})
.post( (req, res) => {
    const user = new User({
       email : req.body.username,
       password : req.body.password 
    });

    user.save( er => {
        if(er) {
            console.log(er);
        } else {
            res.render("secrets");
            console.log("registered.");
        }
    });
});


app.listen(3000, () => {
  console.log(`Server started on port 3000`);
});