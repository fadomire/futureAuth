function init() {
  var socket = io.connect('http://'+window.location.hostname);
  
  function alertHandling(type, message){
    $('#alert_placeholder').html('<div class="alert '+type+'"><a class="close" data-dismiss="alert">×</a><span>'+message+'</span></div>')
  }
  //console.log(socket)
  socket.on('loginCallback', function (data) {
    // convert json response to object
    var jsonResponse = JSON.parse(data);
    console.log(jsonResponse)
    try{
      handleResult(jsonResponse.photos[0]);
    }catch(e){
      alertHandling('alert-error', 'Sorry you were not recognized')
    }
  });
  socket.on('signupSuccessCallback', function (data) {
    alertHandling('alert-success', 'Your signed up, you can now login');
  });
  socket.on('signupFailCallback', function (data) {
    alertHandling('alert-error', data);
  });

  window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
  navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia || navigator.msGetUserMedia;
  setTimeout(function () {
    if (navigator.getUserMedia) {
    var video = document.getElementById('monitor');
    var canvas = document.getElementById('photo');
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

    function snapshot() {
      alertHandling('alert-info', 'Authentication ongoing...');
      
      if($("img").length>3){
        var snapshot = document.getElementsByTagName("img")[3].cloneNode(true);
        
        setTimeout(function () {
          canvas.width = snapshot.width;
          canvas.height = snapshot.height;
          canvas.getContext('2d').drawImage(snapshot, 0, 0);
          var dataUrl = canvas.toDataURL('image/jpeg', 1.0);
          console.log(dataUrl);
          socket.emit("login",dataUrl);
        }, 500);
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


    function handleResult(photo) {
      try{
        if(photo.tags[0].uids[0].confidence > 40){
          alertHandling('alert-success', 'Welcome '+photo.tags[0].label+' !');
          $("#app").html("");
        }else{
          alertHandling('alert-error', 'Sorry you were not recognized');
        }
      }catch(e){
        alertHandling('alert-error', 'Sorry you were not recognized');
      }
      
    }

    

  } else {
    alertHandling('alert-error', 'No native camera support available.');
  }
}, 500);
  

}
$(document).ready(function() {
  init();
});