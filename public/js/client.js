var socket = io.connect('http://'+window.location.hostname);
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
        try {
          var pc = new PeerConnection();
          pc.addStream(stream);
        }catch(e){

        }
        
        video.play();
        
        $("#snapshotbutton").click(snapshot);
        $("#signup").click(signup);
      },
      function errorCallback(error) {
        alertHandling('alert-error', 'No camera available.');
      });
  } else {
    alertHandling('alert-error', 'No native camera support available.');
  }
}, 500);
  

}
function alertHandling(type, message){
  $('#alert_placeholder').html('<div class="alert '+type+'"><a class="close" data-dismiss="alert">×</a><span>'+message+'</span></div>')
}
function snapshot() {
  alertHandling('alert-info', 'Authentication ongoing...');
  if($("img").length>3){
    var snapshot = document.getElementsByTagName("img")[3].cloneNode(true);
    
    $.ajax({
      url: snapshot.src,
      cache: false,
      success:function(html){
        console.log(html);
      },
      error:function(XMLHttpRequest, textStatus, errorThrows){
        console.log(errorThrows)
        console.log(XMLHttpRequest)
        console.log(textStatus)
      }
    });
    console.log("hello")
    // setTimeout(function () {
    //   canvas.width = snapshot.width;
    //   canvas.height = snapshot.height;
    //   canvas.getContext('2d').drawImage(snapshot, 0, 0);
    //   var dataUrl = canvas.toDataURL('image/jpeg', 1.0);
    //   console.log(dataUrl);
    //   socket.emit("login",dataUrl);
    // }, 500);
  }else{
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    var dataUrl = canvas.toDataURL('image/jpeg', 1.0);
    console.log(dataUrl);
    socket.emit("login",dataUrl);
  }
}
function signup() {
      
  alertHandling('alert-info', 'Registration ongoing..');
  var username = $("#username").val();
  if($("img").length>3){
    var snapshot = document.getElementsByTagName("img")[3].cloneNode(true);
    
    setTimeout(function () {
      canvas.width = snapshot.width;
      canvas.height = snapshot.height;
      canvas.getContext('2d').drawImage(snapshot, 0, 0);
      var dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      if(username!=""){
        socket.emit("signup",{
          username: username,
          image: dataUrl
        });
      }else{
        alertHandling('alert-error', 'Please enter a name to signup');
      } 
    }, 500);
  }else{
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    var dataUrl = canvas.toDataURL('image/jpeg', 1.0);
    if(username!=""){
      socket.emit("signup",{
        username: username,
        image: dataUrl
      });
    }else{
      alertHandling('alert-error', 'Please enter a name to signup');
    }
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