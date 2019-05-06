//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan'),
    fs = require('fs'),
    bodyParser = require('body-parser');
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null) {
  var mongoHost, mongoPort, mongoDatabase, mongoPassword, mongoUser;
  // If using plane old env vars via service discovery
  if (process.env.DATABASE_SERVICE_NAME) {
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
    mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'];
    mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'];
    mongoDatabase = process.env[mongoServiceName + '_DATABASE'];
    mongoPassword = process.env[mongoServiceName + '_PASSWORD'];
    mongoUser = process.env[mongoServiceName + '_USER'];

  // If using env vars from secret from service binding  
  } else if (process.env.database_name) {
    mongoDatabase = process.env.database_name;
    mongoPassword = process.env.password;
    mongoUser = process.env.username;
    var mongoUriParts = process.env.uri && process.env.uri.split("//");
    if (mongoUriParts.length == 2) {
      mongoUriParts = mongoUriParts[1].split(":");
      if (mongoUriParts && mongoUriParts.length == 2) {
        mongoHost = mongoUriParts[0];
        mongoPort = mongoUriParts[1];
      }
    }
  }

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      if (err) {
        console.log('Error running count. Message:\n'+err);
      }
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/canvas', (req, res) => {
  let resp = {};
  let lines = fs.readFileSync('grid40x40.txt', 'utf8').split('\r');
  let i = 0;
  for(i = 0; i < lines.length; i++){
    //console.log(lines[i]);
    var vals = lines[i].split(',');
    let j = 0;
    for(j = 0; j < vals.length; j++){
      var index = String(i) + ":" + String(j);
      resp[index] = (vals[j] == '\r') ? "" : vals[j];
    }
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(resp, null, 3));
});

String.prototype.splice = function(ind, rem, str) {
  return this.slice(0, ind) + str + this.slice(ind + Math.abs(rem));
};

function replaceAt(string, index, replace) {
  return string.substring(0, index) + replace + string.substring(index + 1);
}

app.post('/', function(req, res){
  console.log(req.body);
  let lines = fs.readFileSync('grid40x40.txt', 'utf8').split('\r');
  fs.unlinkSync('grid40x40.txt', (err) => {
    if(err) console.log(err);
  })
  var row, col, val, cc = 0, cInd = 0;
  for(var key in req.body){
    row = key.split(":")[0];
    col = key.split(":")[1];
    val = req.body[key];
  }
  console.log("Row: " + row + " | Col: " + col);
  for(var i = 0; i < lines.length; i++){
    if(i == row){
      for(var j = 0; j < lines[i].length; j++){
        if(col == 0){
          if(lines[i][0] == ','){
            lines[i] = val + lines[i];
          } else {
            lines[i][0] = val;
          }
          break;
        }
        if(lines[i][j] == ','){
          cc++;
          cInd = j;
        }
        if(cc == col){
          if(lines[i][cInd + 1] == ','){
            lines[i] = lines[i].splice(cInd + 1, 0, val);
          } else {
            //lines[i][cInd + 1] = val;
            lines[i] = replaceAt(lines[i], cInd + 1, val);
          }
          break;
        }
      }
    }
    if(lines[i][lines[i].length] != '\r') lines[i] = lines[i].splice(lines[i].length, 0, '\r');
    fs.appendFileSync('grid40x40.txt', lines[i], 'utf8');
  }
  res.redirect('/');
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
