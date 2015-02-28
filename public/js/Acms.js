var socket = io.connect('http://localhost:3000');

_("#add").on("click",function(e){
  var title = _("#title")[0].value;
  var text = _("#text")[0].value;

  if(/[a-z]/.test(title) && /[a-z]/.test(text)) {
    socket.emit('post', { Title: title, text:text });
    location.reload();
  }
});

_(".delete").on("click",function(e){

  socket.emit('delete', this.id);
  location.reload();
});

_(".edit").on("click",function(e){
  var title = _("#title")[0].value;
  var text = _("#text")[0].value;

  if(/[a-z]/.test(title) && /[a-z]/.test(text)) {
    socket.emit('edit', this.id, { Title: title, text:text } );
    location.reload();
  }
});



//socket.emit('post', { Title: "TEST POST", text:"Text POST client 1" });
//socket.emit('delete', 0);
