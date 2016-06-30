var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var config = require('../config');
var jwt = require('jsonwebtoken');
var User = require('../models/user'); // get our mongoose model
var Venue = require('../models/venue');
var Token = require('../models/token');
var mongoose = require('mongoose');
var venue_response = "";
var login_response = "Currently not logged in";

/* GET Index page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Bartinder' });
});

/* Home page (venue show page) both initial display and to update database if modified */
router.get('/home', function(req, res){
  Venue.find({}, function(err, venues){
    venues_length = venues.length;
    res.render('home', {venues_length: venues_length});
  });
});
// ajax call to get current venue info
router.post('/home_render', function(req, res){
  var current_venue = req.body.current_venue;
  console.log("Home render post route. Current venue: " + current_venue);
  Venue.find({}, function(err, venues){
    venue = venues[current_venue];
    venues_length = venues.length;
    res.json({current_venue: current_venue, venue: venue, venues_length: venues_length});
  });
});
//ajax call to check to see if current venue has been modified
router.post('/wasVenueUpdated', function(req, res) {
  var venue_id = req.body.venue_id;
  console.log(venue_id);
  Venue.findOne({'_id': venue_id}, function(err, venue){
      var recent_modified = venue['recent_modified'];
      if (recent_modified) {
        Venue.findOneAndUpdate({'_id': venue_id}, {recent_modified: false}, {new: true}, function(err, venue) {
          console.log("Updated venue: " + venue);
          if (err) {
            console.log('got an error');
          }
        });
      }
      res.json({ recent_modified: recent_modified});
  });
});
//Bouncer's screen to check in and out patrons and update comments
  //Get route to display form
router.get('/clicker', function(req, res, next) {
  var test = req.headers.cookie;
  if (test){
    console.log("Cookie from header: "+test);
    console.log("Cookie after substring action: " + test.substring(11));
    var token = test.substring(11);
    Token.findOne({'token': token}, function(err, tokens){
      console.log("Clicker token from token find one: ")
      if (tokens){
        User.findOne({'_id': tokens['user_id']}, function(err, users) {
          Venue.findOne({'_id': users['venue_id']}, function(err, venues){
            login_response = "Authorized for "+venues['name'];
            var name = venues['name'];
            var venue_id = venues['_id'];
            var patron_number = venues['patron_number'];
            var comment = venues['comment'];
            res.render('clicker', {name: name, venue_id: venue_id, patron_number: patron_number, comment: comment, venue_response: venue_response});
          });
        });
      } else {
        login_response = "Login failed";
        console.log(login_response);
        res.redirect('/login');
      }
    });  
  } else {
    login_response = "Login failed";
    console.log(login_response);
    res.redirect('/login');
  }
});
  //post route to update comment and to make recent modified variable true
router.post('/tracked', function(req, res, next){
  var comment = req.body.comment;
  var venue_id = req.body.venue_id;
  var recent_modified = true;
  Venue.findOneAndUpdate({'_id': venue_id}, {comment: comment, recent_modified: recent_modified}, {new: true}, function(err, venue) {
    res.json({
            success: true,
            message: 'Venue no longer reads as recently modified.'
            });
    if (err) {
      console.log('got an error');
    }
  });
});
  //post route to update patron number and to make recent modified variable true
router.post('/clicker_update', function(req, res, next){
  var patron_number = req.body.patron_number;
  var comment = req.body.comment;
  console.log(comment);
  var venue_id = req.body.venue_id;
  var recent_modified = true;
  if (comment) {
    console.log("if no comment entered - shouldn't see this");
    Venue.findOneAndUpdate({'_id': venue_id}, {comment: comment, patron_number: patron_number, recent_modified: recent_modified}, {new: true}, function(err, venue) {
      res.json({
              success: true,
              message: 'Venue no longer reads as recently modified.'
              });
      if (err) {
        console.log('got an error');
      }
    });
  } else {
    Venue.findOneAndUpdate({'_id': venue_id}, {patron_number: patron_number,recent_modified: recent_modified}, {new: true}, function(err, venue) {
      res.json({
              success: true,
              message: 'Venue no longer reads as recently modified.'
              });
      if (err) {
        console.log('got an error');
      }
    });
  }
});

// New User registration
  //get route to show form
router.get('/register', function(req, res, next) {
  var venue_id = [];
  var venue_name = [];
  Venue.find({}, function(err, venues) {
    for (var i = 0; i<venues.length; i++) {
      venue_name[i] = venues[i]['name'];
      venue_id[i] = venues[i]['_id'];
    }
  res.render('register', {title: 'Registration', venue_name: venue_name, venue_id: venue_id}); 
  });
});
  //post route to update database
router.post('/new_user', function(req,res,next){
	var name = req.body.name;
	var password = req.body.password;
	var admin = false;
  var venue_id = req.body.venues;
  var new_user = new User({
    name: name, 
    password: password, 
    admin: admin,
    venue_id: venue_id
  });

  new_user.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');

  });
  res.redirect('/login');
});

//login in registered user
  //get route to display form
router.get('/login', function(req, res, next) {
	res.render('login', {title: 'Login', login_response: login_response});
});
  //post route to authenticate user
    //give token to registered user with good password
router.post('/authenticate', function(req, res) {
  var name = req.body.name;
  var password = req.body.password;

  User.findOne({
    name: name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    }
    else if (user) {

      bcrypt.compare(password, user.password, function(err, result) {
        if (!result) {
          res.json({ success: false, message: 'Authentication failed. Wrong password.' });
        }
        else {
          // if user is found and password is right
          // create a token
          var token = jwt.sign(user, config.secret, {
            expiresInMinutes: 1440 // expires in 24 hours
          });

          // return the information including token as JSON
          var user_id = user['_id'];
          var new_token = new Token({
            token: token,
            user_id: user_id
          });
          new_token.save(function(err) {
            if (err) throw err;

            console.log('Token saved successfully');

          });
          res.json({
            success: true,
            message: 'Enjoy your token!',
            token: token
          });
        }
      });

    }
  });

});

// Admin inputing new venues
  //get route to display form
router.get('/new', function(req, res, next) {
  var test = req.headers.cookie;
  if (test){
    console.log("Cookie from header: "+test);
    console.log("Cookie after substring action: " + test.substring(11));
    var token = test.substring(11);
    Token.findOne({'token': token}, function(err, tokens){
      console.log("New venue token from token find one: " + tokens)
      if (tokens){
        User.findOne({'_id': tokens['user_id']}, function(err, users) {
            var admin_status = users['admin'];
            if (admin_status) {
            venue_response = "Authorized to Add Venues";
            res.render('new', {title: 'New Venue', venue_response: venue_response});
            } else {
              Venue.findOne({'_id': users['venue_id']}, function(err, venues){
              var name = venues['name'];
              var venue_id = venues['_id'];
              var patron_number = venues['patron_number'];
              var comment = venues['comment'];
              res.render('clicker', {name: name, venue_id: venue_id, patron_number: patron_number, comment: comment});
              });
            }
        });
      } else {
        login_response = "Login Failed";
        console.log(login_response);
        res.redirect('/login');
      }
    });  
  } else {
    res.redirect('/');
  }
});
  //post route to update database
router.post('/new_venue', function(req,res,next){
	var name = req.body.name;
	var location = req.body.location;
	var hours = req.body.hours;
	var logo_url = req.body.logo_url;
	var website_url = req.body.website_url;
	var capacity = req.body.capacity;
	var patron_number = 0;
	var comment = "Come on in!";
  var recent_modified = true;
	Venue.find({}, function(err, venue){
		Venue.collection.insert({name: name, location: location, hours: hours, logo_url: logo_url, website_url: website_url, capacity: capacity, patron_number: patron_number, comment: comment, recent_modified: recent_modified});
		venue_response = "You successfully added a venue to the database!";
		res.redirect('/new');
	});
});

module.exports = router;