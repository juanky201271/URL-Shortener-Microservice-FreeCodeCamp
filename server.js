'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }); 

var urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

var UrlModel = mongoose.model("UrlModel", urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyParser.urlencoded({ entended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl/new', function (req,res) {

  var pURL = req.body.url;
  var pURLp = pURL.replace(/(^\w+:|^)\/\//, "");
  dns.lookup(pURLp, function(err, add, fam) {
    if (err) {
      res.json({"error":"invalid URL"});
      console.error(err);
    } else {
      UrlModel.findOne({original_url: pURLp}, 'short_url', function(err, data) {
          if (err || data === null) {
            var q = UrlModel.find().count();
            q.exec(function(err,data) {
              console.log(err + '-' + data)
              if (err || data === null) {
                var doc = new UrlModel({original_url:pURLp ,short_url:1});
                doc.save(function(err,d) {
                  if (err) {
                    return console.error(err);
                  } else {
                    res.json({original_url:pURLp ,short_url:1});
                  }
                });
                return console.error(err);
              } else {
                var doc = new UrlModel({original_url:pURLp ,short_url: (data + 1)});
                doc.save(function(err,d) {
                  if (err) {
                    return console.error(err);
                  } else {
                    res.json({original_url:pURLp ,short_url: (data + 1)});
                  }
                });
              }
            });
            return console.log(err);       
          } else {
            res.json({original_url:pURLp ,short_url:data.short_url});  
          }
      });       
    }
  }); 
      
}); 

app.get('/api/shorturl/:shortUrl', function (req,res) {
  UrlModel.findOne({short_url: req.params.shortUrl}, 'original_url', function(err, data) {
    if (err || data === null) {
      res.json({"error":"invalid URL"});
      return console.error(err);
    } else {
      res.redirect("https://" + data.original_url);
    }
  });
});
  
app.listen(port, function () {
  console.log('Node.js listening ...');
});