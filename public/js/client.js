function init() {
  var socket = io.connect('http://'+window.location.hostname);
  socket.on('loginCallback', function (data) {
    // convert json response to object
    var response = JSON.parse(data);
    handleResult(response.photos[0]);
  });
  socket.on('signupSuccessCallback', function (data) {
    alertHandling('alert-success', 'Your signed up, you can now login');
  });
  socket.on('signupFailCallback', function (data) {
    alertHandling('alert-error', 'Sorry username '+data+' is already taken');
  });

  window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
  navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia || navigator.msGetUserMedia;

  if (navigator.getUserMedia) {
    var video = document.getElementById('monitor');
    var canvas = document.getElementById('photo');
    navigator.getUserMedia({video:true},
      function successCallback(stream) {
        video.src = window.URL.createObjectURL(stream) || stream;
        video.play();
        
        $("#snapshotbutton").click(snapshot);
        $("#signup").click(signup);
      },
      function errorCallback(error) {
        alertHandling('alert-error', 'No camera available.');
      });

    function snapshot() {
      alertHandling('alert-info', 'Authentication ongoing...');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      var dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      socket.emit("login",dataUrl);

      
    }

    function signup() {
      alertHandling('alert-info', 'Registration ongoing..');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      var dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      var username = $("#username").val();
      if(username!=""){
        socket.emit("signup",{
          username: username,
          image: dataUrl
        });
      }else{
        alertHandling('alert-error', 'Please enter a name to signup');
      }
    }


    function handleResult(photo) {
      try{
        if(photo.tags[0].uids[0].confidence > 50){
          alertHandling('alert-success', 'Welcome '+photo.tags[0].uids[0].uid.split('@')[0]+' !');
          $("#app").html("");
        }else{
          alertHandling('alert-error', 'Sorry you were not recognized');
        }
      }catch(e){
        alertHandling('alert-error', 'Sorry you were not recognized');
      }
      
    }

    function alertHandling(type, message){
      $('#alert_placeholder').html('<div class="alert '+type+'"><a class="close" data-dismiss="alert">×</a><span>'+message+'</span></div>')
    }

  } else {
    alertHandling('alert-error', 'No native camera support available.');
  }

}
init();