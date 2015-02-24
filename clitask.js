var fs = require("fs");
var path = require("path");
var args = process.argv.splice(2);
var command = args.shift();

var taskDescription = args.join(" ");

var taskIndex = parseInt(args);

var file = path.join(process.cwd(), "/tasks");

switch(command) {
  case "list":
    listTasks(file);
    break;
  case "add":
    addTask(file, taskDescription);
    break;
  case "delete":
    deleteTask(file, taskIndex);
    break;
  default:
    console.log("Usage: " + process.argv[0] + " list | add [taskDescription]");
};

function LoadorInitialize(file, callback) {
  fs.exists(file, function(exist){
    var tasks = [];
    if(exist) {
      fs.readFile(file,"utf8", function(err, data){
        if(err)throw err;
        var data = data.toString();
        var tasks = JSON.parse(data || "[]");
        callback(tasks);
      });
    } else {
      callback([]);
    }
  });
};

function listTasks(file) {
  LoadorInitialize(file, function(tasks){
    for(var i in tasks) {
      console.log(tasks[i]);
    }
  });
};

function storeTask(file, tasks) {
  fs.writeFile(file, JSON.stringify(tasks), "utf8", function(err){
    if(err)throw err;
    console.log("Saved");
  });
};

function addTask(file, taskDescription) {
  var task = {};
  task.created = new Date();
  task.description = taskDescription;
  LoadorInitialize(file, function(tasks){
    tasks.push(task);
    storeTask(file,  tasks);
  });
};

function deleteTask(file, taskIndex) {
  if(taskIndex || taskIndex == 0) {
    LoadorInitialize(file, function(tasks){
      tasks.splice(taskIndex, 1);
      storeTask(file, tasks);
    });
  } else {
    console.log("Not a task, enter a number");
  }
};
