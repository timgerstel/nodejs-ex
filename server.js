const http = require('http'),
  fs = require('fs'),
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express(),
  port = 8000;
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => res.sendFile('index.html'));
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

app.listen(port, () => console.log(`Website running on port ${port}`));
