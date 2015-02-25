var fs = require("fs");
var path = require("path");
var url = require("url");
var morgan = require("morgan");
var qs = require("querystring");
var express = require("express");
var server = express();

module.exports = function(name,port, ip) {

//utility function
function getDate() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();

  if(dd<10) {
      dd='0'+dd
  }

  if(mm<10) {
      mm='0'+mm
  }

  today = mm+'-'+dd+'-'+yyyy;
  return today;
}

var items = [];

if(!name) {
  console.log("provide a name for the api");
} else {
  createDir(name);
  createDir("log");
}

var logfile = path.join(__dirname, "/log/log" + getDate());
var file = path.join(__dirname, name +"/"+ name);

function createDir(name) {
  if(fs.existsSync(__dirname + "/" + name)){
    console.log(name + " exists");
  } else {
    fs.mkdirSync(__dirname + "/" +name);
  }
}

// create a write stream (in append mode)
var LogStream = fs.createWriteStream(logfile, {flags: 'a'});

server.use(morgan("combined", {stream: LogStream}));
server.use(morgan("dev"));

server.use("/",function(req, res){

  var chemin = url.parse(req.url).pathname;
  var itemIndex = chemin.slice(1);

    req.setEncoding("utf8");

    function LoadorInitialize(file, callback) {
      fs.exists(file, function(exist){
        if(exist) {
          fs.readFile(file,"utf8", function(err, data){
            if(err)throw err;
            var data = data.toString();
            items = JSON.parse(data || "[]");
            callback(items);
          });
        } else {
          callback([]);
        }
      });
    };

    LoadorInitialize(file, function(items){
      switch(req.method) {
        case "GET":
          listitems(file);
          break;
        case "POST":
          var item = "";
          req.on("data", function(chunk){
            item += chunk;
          });
          req.on("end", function(){
            if(item !== "")additem(file, item);
          });
          break;
        case "DELETE":
          deleteitem(file, itemIndex);
          break;
        case "PUT":
          var item = "";
          req.on("data", function(chunk){
            item += chunk;
          });
          req.on("end", function(){
            if(item !== "")modifyitem(file, item, itemIndex);
          });
          break;
        default:
          console.log("Must use in an http server");
          res.end();
      }
    });

    function listitems(file) {
      var rangeString = /\d-\d/;
      var singleString = /^\d+$/;

      LoadorInitialize(file, function(items){
        res.statusCode = 200;
        if(singleString.test(itemIndex)) {
          if(itemIndex || itemIndex === 0) {
            if(items[itemIndex]) {
              var item = JSON.stringify(items[itemIndex]);
              res.write("\n\n" + itemIndex + ")" + " " + item)
            } else {
              res.write("no Match");
            }
          }
        }else if(rangeString.test(itemIndex)){
          var max = itemIndex.substr(itemIndex.indexOf("-")+1);
          var min = itemIndex.slice(0, itemIndex.indexOf("-"));
          console.log("range = "+min+" - "+max);
          if(max < items.length) {
            for(var i = min; i <= max; i++) {
              var item = JSON.stringify(items[i]);
              res.write( "\n\n" + i + ")" + " " + item);
            }
          } else {
            console.log("range is to great, they are only " + items.length +" "+ name);
            res.end("range is to great, they are only " + items.length +" "+ name);
          }
        }else if(itemIndex && !singleString.test(itemIndex)) {
          for(var i in items) {
            if(items[i].title == itemIndex) {
              var item = JSON.stringify(items[i]);
              res.end("\n\n" + i + ")" + " " + item);
            }
          }
          console.log("no match for " + itemIndex);
          res.end("no match for " + itemIndex);
        } else {
          for(var i in items) {
            var item = JSON.stringify(items[i]);
            res.write( "\n\n" + i + ")" + " " + item);
          }
        }
        res.end("\n\ndone");
      });
    };

    function storeitem(file, items, message) {
      fs.writeFile(file, JSON.stringify(items), "utf8", function(err){
        if(err) {
          res.statusCode = 404;
          console.log(err);
          res.end(err);
        }
        res.statusCode = 200;
        if(message) {
          res.end(message);
        } else {
          res.end("item added");
        }
      });
    };

    function additem(file, itemDescription) {
      if(!itemDescription)console.log("no item description");
      var item = {};
      if(Object.keys(qs.parse(itemDescription)).length > 1) {
        item = qs.parse(itemDescription);
      } else {
        if(qs.parse(itemDescription)[Object.keys(qs.parse(itemDescription))[0]]) {
          item.description = qs.parse(itemDescription)[Object.keys(qs.parse(itemDescription))[0]];
        } else {
          item.description = itemDescription;
        }
      }
      item.created = new Date();

      var lowerItem = {};
      for(prop in item) {
        lowerItem[prop.toLowerCase()] = item[prop];
      }

      LoadorInitialize(file, function(items){
        items.push(lowerItem);
        storeitem(file,  items);
      });
    };

    function deleteitem(file, itemIndex) {
      if(isNaN(itemIndex)) {
        res.statusCode = 404;
        res.end("Not a item, enter a number");
      } else if(!items[itemIndex]) {
        res.statusCode = 404;
        res.end("Not a item, enter a number");
      } else {
        LoadorInitialize(file, function(items){
          items.splice(itemIndex, 1);
          storeitem(file, items, "\n\nitem " + itemIndex +" deleted");
        });
      }
    };

    function modifyitem(file, itemDescription, itemIndex) {
      if(itemDescription) {
        if(isNaN(itemIndex)) {
          res.statusCode = 404;
          res.end("Not a item, enter a number");
        } else if(!items[itemIndex]) {
          res.statusCode = 404;
          res.end("Not a item, enter a number");
        } else {
          LoadorInitialize(file, function(items){
            var item = {};
            if(Object.keys(qs.parse(itemDescription)).length > 1) {
              var item = qs.parse(itemDescription);
              for(high in item) {
                item[high.toLowerCase()] = item[high];
              }
              if(items[itemIndex]) {
                for(prop in item) {
                  if(prop !== "created")items[itemIndex][prop.toLowerCase()] = item[prop.toLowerCase()];
                }
              } else {
                items[itemIndex] = itemDescription;
              }
            }else {
              item = itemDescription;
              items[itemIndex].description = itemDescription;
            }
            storeitem(file, items, "item " + itemIndex + " modified");
          });
        }
      } else {
        res.statusCode = 404;
        res.end("No modification, enter modification to do");
      }
    };

});

if(ip) {
  server.listen(port,ip, function(){
  var startmess = "listening form API on  " + ip + ":" + port +" on " + new Date() +"\n" ;
  LogStream.write(startmess, function(){
    console.log(startmess);
  });
});
} else if (port) {
  server.listen(port, function(){
  var startmess = "listening form API on  http://localhost:" + port +" on " + new Date() +"\n" ;
  LogStream.write(startmess, function(){
    console.log(startmess);
  });
});
}else {
  server.listen(port, function(){
  var startmess = "listening form API on localhost:27017 on " + new Date() +"\n" ;
  LogStream.write(startmess, function(){
    console.log("listening form API on localhost:27017");
  });
});
}

}
