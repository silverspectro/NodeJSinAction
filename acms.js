var api = require("./api");
var fs = require("fs");
var path = require("path");
var url = require("url");
var morgan = require("morgan");
var favicon = require("serve-favicon");

require("./controller/clientConnection");

api("project", 27017);

var items;

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
    res.render("index", items);
  });
app.route("/:id")
  .get(function(req, res){
    app.set("item_id", req.params.id);
    res.render("project", items);
  });


server.listen(3000, function() {
  console.log("app Listening on localhost:3000");
});
