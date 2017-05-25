var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var validator = require('express-validator');
var ejs = require('ejs');
var engine = require('ejs-mate');
var session = require('express-session');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session); //session will be destroyed without it if refresh page
var passport = require('passport'); // use for validation
var flash = require('connect-flash'); // if some error happen, it can show them


var app = express();

mongoose.Promise = global.Promise;// http://majing.io/questions/540
mongoose.connect('mongodb://localhost/webtest'); //db name

require('./config/passport');
require('./secret/secret');

app.use(express.static('public'));
app.engine('ejs',engine);
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(validator()); // after body-parser

app.use(session({
    secret:'ThisismytestKey',
    resave:false,
    saveUninitialized: false,
    store: new MongoStore({mongooseConnection: mongoose.connection}) //session store will save in db
}));

//passport must be added after session
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

require('./routes/user')(app, passport); // give route info
require('./routes/message')(app); // give route info

app.listen(3000, function(){
    console.log('listening ........');
})