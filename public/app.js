var appGrid= document.getElementById('appForm').getElementsByTagName('table');

function create_canvas(){
  var i, j;
  var maxRows = 40;
  var maxCols = 80;
  var req = new XMLHttpRequest();
  req.open("GET", '/canvas', false);
  req.send(null);
  let res = JSON.parse(req.responseText);
  for(i = 0; i < maxRows; i++){
    var tr = appGrid[0].appendChild(document.createElement('tr'));
    for(j = 0; j < maxCols; j++){
      var td = tr.appendChild(document.createElement('td'));
      var cell = document.createElement("input");
      cell.setAttribute("class", "aCell");
      cell.setAttribute("id", String(i) + ":" + String(j));
      cell.setAttribute("type", "text");
      cell.value = res[String(i) + ":" + String(j)];
      cell.maxLength = 1;
      td.appendChild(cell);
    }
  }
}

window.onload = create_canvas();

function setCookie(name, value, exp){
  var d = new Date();
  d.setTime(d.getTime() + (exp*24*60*60*1000));
  var exp = "expires=" + d.toUTCString();
  document.cookie = name + "=" + value + ";" + exp + ";";
}

function getCookie(name){
  var cookie = name + "=";
  var dCookie = decodeURIComponent(document.cookie);
  var cookies = dCookie.split(';');
  for(var i = 0; i < cookies.length; i++) {
    var c = cookies[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(cookie) == 0) {
      return c.substring(cookie.length, c.length);
    }
  }
  return "";
}

$(document).ready(() => {
  var lastEdit = getCookie("lastEdit");

  $('input.aCell').on('keypress', (e) => {
    var foc = $(':focus');
    var index = foc.attr('id');
    var req = new XMLHttpRequest();
    req.onload = () => {
      window.location = "/";
    }
    var key = String.fromCharCode(e.keyCode);
    req.open("POST", '/', true);
    req.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    var dat = {};
    if(lastEdit != ""){
      var diff = Math.floor((Date.now() - lastEdit) / 1000 / 60);
      if((10 - diff) > 0){
        foc.attr('readonly', true);
      } else {
        foc.val(key);
        setCookie("lastEdit", Date.now());
        dat[index] = key;
        req.send(JSON.stringify(dat));
      }
    } else {
      foc.val(key);
      setCookie("lastEdit", Date.now());
      dat[index] = key;
      req.send(JSON.stringify(dat));
    }
    req.onreadystatechange = () => {
        
    }
  });
});