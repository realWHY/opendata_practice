var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var async = require('async');
var crypto = require('crypto');
var User = require('../models/user');
var Open = require('../models/open');
var secret = require('../secret/secret');

module.exports = (app, passport) => {
    app.get('/', function(req, res, next){
        if(req.session.cookie.originalMaxAge !== null){
            res.redirect('/home');
        }
        else{
            res.render('index',{title:'Home Page'});
        }
    }) ;
    
    app.get('/signup',(req,res)=>{
        console.log('listening ........signup');
        var errors = req.flash('error');
        res.render('user/signup',{title:'Sign Up', messages: errors, hasErrors:
        errors.length>0});
    });

    
    app.post('/signup', signupValidate, passport.authenticate('local.signup',{//first validate, if pass, the next enable authenticate to execute
        successRedirect:'/',
        failureRedirect:'/signup',
        failureFlash: true // when the error message is added, it willbe dispayes to user
    }));//local.signup name from passport
    
     app.get('/login',(req,res)=>{
         console.log('listening ........login');
        var errors = req.flash('error');
        res.render('user/login',{title:'LOG IN', messages: errors, hasErrors:
        errors.length>0});
    });
    
     app.post('/login', loginValidate, passport.authenticate('local.login',{//first validate, if pass, the next enable authenticate to execute
//        successRedirect:'/home',
        failureRedirect:'/login',
        failureFlash: true // when the error message is added, it willbe dispayes to user
    }), (req,res) =>{
         //req.logout();
         console.log('req.body.rememberme  '+req.body.rememberme);
         if(req.body.rememberme){
            req.session.cookie.maxAge = 30*24*60*60*1000; // 30 days
        }else{
            req.session.cookie.expires = null;
        }
        console.log('req.user  '+req.user);
        console.log('req.session.cookie.maxAge  '+req.session.cookie.maxAge);
        res.redirect('/home');
    });//local.signup name from passport
    
    app.get('/forgot',(req,res)=>{
        console.log('listening ........forgot');
        var errors = req.flash('error');
        var info = req.flash('info');
        res.render('user/forgot',{title: 'Request Password Reset', messages: errors, hasErrors:errors.length>0, info: info, noErrors:info.length>0});
    });
    
    app.post('/forgot', (req,res,next)=>{
       async.waterfall([
           // generate random token
           function(callback){
               crypto.randomBytes(20,(err,buf)=>{//the data will be saved in the buf
                    var rand = buf.toString('hex'); 
                    callback(err,rand);
               });
           },
           
           // check if email is valid
           function(rand, callback){
               User.findOne({'email':req.body.email},(err,user)=>{//if email is exist, store it in user variable
                    if(!user){
                        req.flash('error','Eamil is invalid');
                        return res.redirect('/forgot')
                    }else{
                        user.passwordResetToken = rand;
                        user.passwordResetExpires = Date.now()+60*60*1000; //ms
                        user.save((err)=>{
                            callback(err, rand, user);
                        })
                    }                  
               });
           },
           
           //send email to user
           function(rand, user, callback){
               var smtpTransport = nodemailer.createTransport({
                   service:'Gmail',
                   auth:{
                       user:secret.auth.user,
                       pass:secret.auth.pass
                   }
               });
               var mailOptions = {
                   to: user.email,
                   from: 'WebTest'+'<'+secret.auth.user+'>',
                   subject: 'Reset Token',
                   text: 'you receive reset token \n\n'+
                   'please click on the link \n\n'+
                   'http://localhost:3000/reset/'+rand+'\n\n'
               };
               smtpTransport.sendMail(mailOptions, (err, response) =>{
                    req.flash('info', 'A password reset token has been sent to '+user.email);
                   return callback(err, user);
               });
           }
       ], (err) =>{
           if(err){
               return next(err);
           }
           else{
               res.redirect('/forgot');
           }    
       }) 
    });
    
    app.get('/reset/:token',(req, res) =>{
        User.findOne({passwordResetToken:req.params.token, passwordResetExpires:
        {$gt:Date.now()}},(err,user)=>{
            if(!user){
                req.flash('error', 'Password reset token has expired');
                return res.redirect('/forgot');
            }  
            else{     
                var error = req.flash('error');
                var success = req.flash('success');
                    
                res.render('user/reset', {title: 'Reset Your Password', messages: error, hasErrors: error.length > 0, success:success, noErrors:success.length > 0});
        }
        });  
    });
    
    app.post('/reset/:token',(req,res)=>{
        async.waterfall([
            function(callback){
                User.findOne({passwordResetToken:req.params.token, passwordResetExpires:{$gt:Date.now()}},(err,user)=>{
                    if(!user){
                        req.flash('error', 'Password reset token has expired');
                        return res.redirect('/forgot');
                    }  
                    else{  
                        req.checkBody('password', 'Password is required').notEmpty();
                        req.checkBody('password', 'Password must not less than five').isLength({min:5});
                        
                        var errors = req.validationErrors();
                        
                        if(req.body.password == req.body.cpassword){
                            if(errors){
                                var messages = [];
                                errors.forEach((error)=>{
                                    messages.push(error.msg);
                                })
                                
                                var errors = req.flash('error', messages);
                                res.redirect('/reset/'+req.params.token);
                            }
                            else{
                                user.password = user.encryptPassword(req.body.password);
                                user.passwordResetToken = undefined;
                                user.passwordResetExpires = undefined;
                                user.save((err)=>{
                                    req.flash('success', 'Password updated successfully');
                                    callback(err,user);
                                })
                            }
                        }
                        else{
                            req.flash('error', 'Password and confirm password are not equal');
                            res.redirect('/reset/'+req.params.token);
                        }
                    }
                });  
            },
            
            function(user, callback){
                var smtpTransport = nodemailer.createTransport({
                   service:'Gmail',
                   auth:{
                       user:secret.auth.user,
                       pass:secret.auth.pass
                   }
                });
                var mailOptions = {
                   to: user.email,
                   from: 'WebTest'+'<'+secret.auth.user+'>',
                   subject: 'Reset password successfully',
                   text: 'your password is updated successfully !'
                };
                smtpTransport.sendMail(mailOptions, (err, response) =>{
                    callback(err,user);
                    
                    var error = req.flash('error');
                    var success = req.flash('success');
                    
                    res.render('user/reset', {title: 'Reset Your Password', messages: error, hasErrors: error.length > 0, success:success, noErrors:success.length > 0});
                });             
            }         
        ]);
    });
    app.get('/logout',(req,res)=>{
        req.logout();
        req.session.destroy((err)=>{
            res.redirect('/');
        })
    });
    
    app.get('/home',isLoggedIn,(req,res)=>{
        console.log('listening ........home');
        res.render('user/home',{title:'HOME', user: req.user});
    });
    
    app.get('/wide',isLoggedIn,(req,res)=>{
        console.log('listening ........wide');
        data = undefined;
        res.render('user/wide',{title:'Wide', user: req.user,data:data});
    });
    
    app.get('/smallrange',isLoggedIn,(req,res)=>{
        console.log('listening ........smallrange');
        data = undefined;
        res.render('user/smallrange',{title:'smallrange', user: req.user,data:data});
    });
    
     app.post('/smallrange',(req,res)=>{
        console.log(req.body.opt);
        Open.find({'County':req.body.level1, 'Town':req.body.level2}, (err,data)=>{        
            console.log(data);
            res.render('user/smallrange',{title:'smallrange', user: req.user, data:data});
        });        
        
    });
    
    app.post('/wide',(req,res)=>{
        console.log(req.body.rankinput);
        Open.find({'County':req.body.rankinput}, (err,data)=>{        
            console.log(data);
            res.render('user/wide',{title:'smallrange', user: req.user, data:data});
        });        
        
    });
    
    app.get('/precision',isLoggedIn,(req,res)=>{
        console.log('listening ........precision');
        res.render('user/precision',{title:'precision', user: req.user});
    });
    
    app.get('/contact',isLoggedIn,(req,res)=>{
        console.log('listening ........contact');
        res.render('user/contact',{title:'contact', user: req.user});
    });
}

function signupValidate(req,res,next){
    req.checkBody('fullname', 'Fullname is required').notEmpty();//validator methor
    req.checkBody('fullname', 'Fullname must not less than five').isLength({min:3});
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is invalid').isEmail();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password', 'Password must not less than five').isLength({min:5});
    
    var errors = req.validationErrors(); // return array
    if(errors){
        var messages = [];
        errors.forEach((error)=>{
            messages.push(error.msg);
        });
        req.flash('error',messages);
        res.redirect('/signup');
    }
    else{
        return next();
    }
}

function loginValidate(req,res,next){
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is invalid').isEmail();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password', 'Password must not less than five').isLength({min:5});
    
    var errors = req.validationErrors(); // return array
    if(errors){
        var messages = [];
        errors.forEach((error)=>{
            messages.push(error.msg);
        });
        req.flash('error',messages);
        res.redirect('/login');
    }
    else{
        return next();
    }
}

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        next();
    }else{
        res.redirect('/');
    }
}