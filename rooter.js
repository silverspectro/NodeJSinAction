var api = require("./api");
var http = require("http");
var fs = require("fs");
var path = require("path");
var url = require("url");
var morgan = require("morgan");
var qs = require("querystring");
var favicon = require("serve-favicon");
var marked = require("marked");
var express = require("express");

api("project", 27017);

var items;

var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

function createDir(name) {
  if(fs.existsSync(__dirname + "/" +name)){
    console.log(name + " exists");
  } else {
    fs.mkdirSync(__dirname +"/"+name);
  }
}

createDir("views");
createDir("public");
createDir("public/images");

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.set("marked", marked);
app.set("Title", "cirodecaro.net | Tech dev & graphism");
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

function getRequest(host, port, path, callback) {
  var getReq = {
    host:host,
    port:port,
    path:path,
    method:"GET"
  };

  http.request(getReq, function(res){
    res.setEncoding("utf8");
    res.on("data", function(apidata){
      items = JSON.parse(apidata);
      app.set("items", items);
      if(callback)callback(items);
    });
  }).end();
}

function postRequest(host, port, path, data, callback) {
  data = qs.stringify(data);

  var postOptions = {
    host:host,
    port:port,
    path:path,
    method:"POST",
    headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.length
      }
  };

  var post_req = http.request(postOptions, function(res){
    res.setEncoding("utf8");
    res.on("data", function(apidata){
      items = apidata;
      app.set("items", items);
      if(callback)callback(items);
    });
  });

  post_req.write(data);
  post_req.end();
}

function deleteRequest(host, port, path, callback) {
  var delReq = {
    host:host,
    port:port,
    path:path,
    method:"DELETE"
  };

  http.request(delReq, function(res){
    res.setEncoding("utf8");
    res.on("data", function(apidata){
      items = apidata;
      app.set("items", items);
      if(callback)callback(items);
    });
  }).end();
}

io.on('connection', function (socket) {
  socket.on('post', function(message){
    postRequest("localhost", "27017", "/api/project", message, function(items){
      console.log(items);
    });
  });
  socket.on('get', function(message){
    getRequest("localhost", "27017", "/api/project", function(items){
      console.log(items);
    });
  });
  socket.on('delete', function(id){
    deleteRequest("localhost", "27017", "/api/project/" + id, function(items){
      console.log(items);
    });
  });
});

app.use(function(req, res, next){
  var chemin = url.parse(req.url).path;

  //console.log(chemin.split("/").length - 1 === 1);
  if(chemin.split("/").length - 1 === 1) {
    getRequest("localhost", "27017", "/api/project" + chemin, function(){
      next();
    });
  }

});

app.route("/")
  .get(function(req, res){
    res.render("index");
  });
app.route("/:id")
  .get(function(req, res){
    res.render("project");
  });


server.listen(3000, function() {
  console.log("app Listening on localhost:3000");
});
