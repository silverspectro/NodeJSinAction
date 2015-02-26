var api = require("./api2");
var fs = require("fs");
var path = require("path");
var url = require("url");
var morgan = require("morgan");
var qs = require("querystring");
var express = require("express");

var api = new api("project", 27017);

var rooter = express();

function createDir(name) {
  if(fs.existsSync(__dirname + "/" +name)){
    console.log(name + " exists");
  } else {
    fs.mkdirSync(__dirname +"/"+name);
  }
}

createDir("public");

rooter.use(express.static(__dirname + "/public/"));
rooter.use(morgan("dev"));

/*rooter.use("/", function(req, res){
  res..end
});*/

rooter.listen(3000, function() {
  console.log("Rooter Listening on localhost:3000");
});
