var fs = require("fs");
var path = require("path");
var url = require("url");
var morgan = require("morgan");
var qs = require("querystring");
var express = require("express");
var server = express();

//utility function
var contains = function (haystack, needle) {
  if(typeof haystack === "object") {
      for(prop in haystack) {
        console.log(prop, needle, prop.hasOwnProperty(needle));
        if(prop.hasOwnProperty(needle)) {
          return true;
        }
      }
  } else {
    return !!~haystack.indexOf(needle);
  }
};

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

var tasks = [];

var logfile = path.join(__dirname, "/log/log" + getDate());
// create a write stream (in append mode)
var LogStream = fs.createWriteStream(logfile, {flags: 'a'});

server.use(morgan("combined", {stream: LogStream}));
server.use(morgan("dev"));

server.use("/",function(req, res){

    var file = path.join(__dirname, "api/tasks");

    req.setEncoding("utf8");

    function LoadorInitialize(file, callback) {
      fs.exists(file, function(exist){
        if(exist) {
          fs.readFile(file,"utf8", function(err, data){
            if(err)throw err;
            var data = data.toString();
            tasks = JSON.parse(data || "[]");
            callback(tasks);
          });
        } else {
          callback([]);
        }
      });
    };

    LoadorInitialize(file, function(tasks){
      switch(req.method) {
        case "GET":
          listTasks(file);
          break;
        case "POST":
          var task = "";
          req.on("data", function(chunk){
            task += chunk;
          });
          req.on("end", function(){
            if(task !== "")addTask(file, task);
          });
          break;
        case "DELETE":
          var chemin = url.parse(req.url).pathname;
          var taskIndex = parseInt(chemin.slice(1), 10);
          deleteTask(file, taskIndex);
          break;
        case "PUT":
          var chemin = url.parse(req.url).pathname;
          var taskIndex = parseInt(chemin.slice(1), 10);
          var task = "";
          req.on("data", function(chunk){
            task += chunk;
          });
          req.on("end", function(){
            if(task !== "")modifyTask(file, task, taskIndex);
          });
          break;
        default:
          console.log("Must use in an http server");
          res.end();
      }
    });

    function listTasks(file) {
      LoadorInitialize(file, function(tasks){
        res.statusCode = 200;
        for(var i in tasks) {
          var task = JSON.stringify(tasks[i]);
          res.write( "\n\n" + i + ")" + " " + task);
        }
        res.end("\n\ndone");
      });
    };

    function storeTask(file, tasks, message) {
      fs.writeFile(file, JSON.stringify(tasks), "utf8", function(err){
        if(err) {
          res.statusCode = 404;
          console.log(err);
          res.end(err);
        }
        res.statusCode = 200;
        if(message) {
          res.end(message);
        } else {
          res.end("task added");
        }
      });
    };

    function addTask(file, taskDescription) {
      if(!taskDescription)console.log("no task description");
      var task = {};
      if(Object.keys(qs.parse(taskDescription)).length > 1) {
        task = qs.parse(taskDescription);
      } else {
        if(qs.parse(taskDescription)[Object.keys(qs.parse(taskDescription))[0]]) {
          task.description = qs.parse(taskDescription)[Object.keys(qs.parse(taskDescription))[0]];
        } else {
          task.description = taskDescription;
        }
      }
      task.created = new Date();

      LoadorInitialize(file, function(tasks){
        tasks.push(task);
        storeTask(file,  tasks);
      });
    };

    function deleteTask(file, taskIndex) {
      if(isNaN(taskIndex)) {
        res.statusCode = 404;
        res.end("Not a task, enter a number");
      } else if(!tasks[taskIndex]) {
        res.statusCode = 404;
        res.end("Not a task, enter a number");
      } else {
        LoadorInitialize(file, function(tasks){
          tasks.splice(taskIndex, 1);
          storeTask(file, tasks, "\n\ntask " + taskIndex +" deleted");
        });
      }
    };

    function modifyTask(file, taskDescription, taskIndex) {
      if(taskDescription) {
        if(isNaN(taskIndex)) {
          res.statusCode = 404;
          res.end("Not a task, enter a number");
        } else if(!tasks[taskIndex]) {
          res.statusCode = 404;
          res.end("Not a task, enter a number");
        } else {
          LoadorInitialize(file, function(tasks){
            tasks[taskIndex].description = taskDescription;
            storeTask(file, tasks, "task " + taskIndex + " modified");
          });
        }
      } else {
        res.statusCode = 404;
        res.end("No modification, enter modification to do");
      }
    };

});

server.listen(27017,"192.168.0.11", function(){
  var startmess = "listening form CLITASK on 192.168.0.11:27017 on " + new Date() +"\n" ;
  LogStream.write(startmess, function(){
    console.log("listening form CLITASK on 192.168.0.11:27017");
  });
});
