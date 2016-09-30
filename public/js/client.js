var socket = io.connect('//'+window.location.hostname);
var video = document.getElementById('monitor');
var canvas = document.getElementById("photo");

window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
navigator.mozGetUserMedia || navigator.msGetUserMedia;

function init() {
  setTimeout(function () {
    if (navigator.getUserMedia) {
    
    if( ! window.URL ){
      window.URL={};
    }
    if( ! window.URL.createObjectURL) {
      window.URL.createObjectURL=function(obj){return obj;}
    }

    navigator.getUserMedia({video:true},
      function successCallback(stream) {
        video.src = window.URL.createObjectURL(stream) || stream;
        video.play();
      },
      function errorCallback(error) {
        alertHandling('alert-error', 'No camera available.');
      });
  } else {
    $("#monitor").hide();
    alertHandling('alert-error', 'Your browser does not support getUserMedia, fallback to selecting a file when clicking or login or signup');
  }
  $("#snapshotbutton").click(snapshot);
  $("#signup").click(signup);
}, 500);
  

}
function alertHandling(type, message){
  $('#alert_placeholder').html('<div class="alert '+type+'"><a class="close" data-dismiss="alert">×</a><span>'+message+'</span></div>')
}
function snapshot() {
  
  if (navigator.getUserMedia) {
    alertHandling('alert-info', 'Authentication ongoing...');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    var dataUrl = canvas.toDataURL('image/jpeg', 1.0);
    //console.log(dataUrl);
    socket.emit("login",dataUrl);
  }else{
    $("#snapshotFile").trigger("click");
    $("#snapshotFile").change(function(event){ 
      var file = event.target.files[0];
      alertHandling('alert-info', 'Authentication ongoing...');
      var fileReader = new FileReader();
      fileReader.onload = function (event) {
        //console.log(event.target.result);
        socket.emit("login",event.target.result);
      };
      fileReader.readAsDataURL(file);
    });
  }
  
  
  
  
}
function signup() {
  var username = $("#username").val();
  if (navigator.getUserMedia) {
    alertHandling('alert-info', 'Registration ongoing..');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    var dataUrl = canvas.toDataURL('image/jpeg', 1.0);
    //console.log(dataUrl)
    if(username!=""){
      socket.emit("signup",{
        username: username,
        image: dataUrl
      });
    }else{
      alertHandling('alert-error', 'Please enter a name to signup');
    }
  }else{
    $("#snapshotFile").trigger("click");
    $("#snapshotFile").change(function(event){
      var file = event.target.files[0];
      alertHandling('alert-info', 'Registration ongoing..');
      var fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = function (event) {
        //console.log(event.target.result);
        if(username!=""){
          socket.emit("signup",{
            username: username,
            image: event.target.result
          });
        }else{
          alertHandling('alert-error', 'Please enter a name to signup');
        }
      };
    });
  }
}

//console.log(socket)
socket.on('loginSuccess', function (data) {
  alertHandling('alert-success', 'Welcome '+data+' !');
  $("#app").html("");
});
socket.on('loginFail', function (data) {
  alertHandling('alert-error', data);
});
socket.on('signupSuccessCallback', function (data) {
  alertHandling('alert-success', 'Your signed up, you can now login');
});
socket.on('signupFailCallback', function (data) {
  alertHandling('alert-error', data);
});

init();
