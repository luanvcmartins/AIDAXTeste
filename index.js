var http = require('http');
var express = require("express");
var app = express();

app.use(express.static(__dirname + '/views'));
app.get('/',function(req,res){
  res.sendFile("index.html");
});

app.listen(8080);

console.log("Server is running on http://localhost:8080");