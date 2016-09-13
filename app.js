
/**
 * Module dependencies.
 * 2016 09 12
 */

var express = require('express');
var sql = require('mssql');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var session = require('express-session');
var expressValidator = require('express-validator');
var bcrypt = require('bcryptjs');

var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var expressMessages = require('express-messages');
var bodyParser = require('body-parser');
var util = require('util');
var app = express();

var User = require('./models/user.js');

//BodyParser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressValidator());


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.bodyParser());


//Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

//Express Validator
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.')
      , root = namespace.shift()
      , formParam = root;
        
        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param : formParam,
            msg   : msg,
            value : value
        };
    }
}));
// Connect Flash
app.use(flash());

app.use(function (req, res, next) {
    res.locals.succes_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', routes.index);



var requestRoute = require('./routes/requestRoute.js');
new requestRoute(app);


http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});


var connection = sql.connect({
    server: "194.169.209.75",
    database: "AptusHR",
    user: "sa",
    password: "@ptus4dev",
    port: 1433
});

//send request

app.post("/request", function (req, res) {
    
    
    var requestTypeId = 1;
    var position = req.body.position;
    var startDate = req.body.startDate;
    var endDate = req.body.toDate;
    var replacement = req.body.replacement;
    
    function formatDate(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
    }
    
    var d = new Date();
    var e = formatDate(d);
    
    
    connection.then(function () {
        new sql.Request().query("INSERT INTO Request (EmployeeID, Date, Position, StartDate, EndDate, Replacement) VALUES ('" + employeeId + "', '" + e + "', '" + position + "','" + startDate + "', '" + endDate + "','" + replacement + "')").then(function (recordset) {
            console.dir(recordset);
        }).catch(function (err) {
            console.dir('eroare de inserare in baza de date', err);
        });
    });



});

//register

app.post("/register", function (req, res) {
    var employeeId = 1;
    var username = req.body.username;
    var password = req.body.password;
    var confirmPassword = req.body.confirmPassword;
    var email = req.body.email;
    var fullName = req.body.fullName;
    var company = req.body.company;
    
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('confirmPassword', 'Password do not match').equals(req.body.password);
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('username', 'username is required').notEmpty();
    req.checkBody('fullName', 'Full name is required').notEmpty();
    req.checkBody('company', 'Company is required').notEmpty();
    
    
    var errors = req.validationErrors();
    
    if (errors) {
        res.render('register', {
            errors: errors
        });
    } else {
        
        console.log('PASSED');
        var salt = bcrypt.genSaltSync(10);
        var passwordToSave = bcrypt.hashSync(password, salt);
        
        connection.then(function () {
            new sql.Request().query("INSERT INTO Employee (CompanyID, FullName, Account, Password, Email) VALUES ('" + company + "', '" + fullName + "','" + username + "', '" + passwordToSave + "','" + email + "')").then(function (recordset) {
                console.dir(recordset);
            }).catch(function (err) {
                console.dir('eroare de inserare in baza de date', err);
            });
        });

        res.redirect('/Home');
    }
    
 
});

//fucking login

passport.use(new LocalStrategy(
    function (username, password, done){
        // User.getUserByUsername(username, function(err, user){
        //     if(err) throw err;
        //     if(!user){
        //         return done(null, false, console.log('unknow user'))
        //     }

        // User.comparePassword(password, user.password, function(err, isMatch){
        //     if (err) throw err;
        //         if (isMatch) {
        //             return done(null, user);
        //         } else {
        //             return done(null, false, console.log('invalid password'));
        //         }
        // });
        // });
        // con
        


    }
));

passport.serializeUser(function(user, done){
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    User.getUserById(id, function(err, user){
        done(err, user);
    });
});

app.post('/Login',
passport.authenticate('local',{
    successRedirect: '/Home',
    failureRedirect: '/Login'
}), function(req, res){
    res.redirect('/');
})