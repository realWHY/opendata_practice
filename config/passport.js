// authentication
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var User = require('../models/user');

//https://cnodejs.org/topic/568dfdb9c2289f51658f0871
passport.serializeUser((user, done)=>{ //(object, callback)
    done(null, user.id);
});

passport.deserializeUser((id, done)=>{
    User.findById(id, (err, user)=>{
        done(err, user);// if the id found, the data will be saved in the object user
    });
});

//sign up
passport.use('local.signup', new localStrategy({//('name', object)
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true //pass all data to the callback below
},(req, email, password, done)=>{
    User.findOne({'email':email},(err, user)=>{
        if(err){//connect failure, db doesn't exist .....etc
            return done(err);
        }

        if(user){//if user already exist
            return done(null,false, req.flash('error', 'User already exist'));
        }
        else{
            var newUser = new User();
            newUser.fullname = req.body.fullname;//from body-parser, it will put the data got from page into req.body, the fullname got from name="fullname" in sigup.ejs
            console.log( newUser.fullname);
            newUser.email = req.body.email;
            newUser.password = newUser.encryptPassword(req.body.password);
            newUser.save((err) => {
                return done(null, newUser);
            });
        }
    })// check if email alredy esist?
}));

//log in
passport.use('local.login', new localStrategy({//('name', object)
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true //pass all data to the callback below
},(req, email, password, done)=>{
    User.findOne({'email':email},(err, user)=>{
        if(err){//connect failure, db doesn't exist .....etc
            return done(err);
        }

        var messages = [];
        if(!user || !user.ValidPassword(password)){//if user already exist
            messages.push('Email does not exists or Password is invalid');
            return done(null,false, req.flash('error', messages));
        }
        
        return done(null, user);
    })// check if email alredy esist?
}));