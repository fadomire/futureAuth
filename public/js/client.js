function init() {
  var socket = io.connect('http://'+window.location.hostname);
  socket.on('loginCallback', function (data) {
    // convert json response to object
    var response = JSON.parse(data);
    handleResult(response.photos[0]);
  });
  socket.on('signupSuccessCallback', function (data) {
    document.getElementById('successMessage').textContent = 'Your signed up, you can now login';
    $("#result").html("");
  });
  socket.on('signupFailCallback', function (data) {
    document.getElementById('errorMessage').textContent = 'Sorry username '+data+' is already taken';
    $("#result").html("");
  });
  window.URL = window.URL || window.webkitURL;
  navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia || navigator.msGetUserMedia;

  if (navigator.getUserMedia) {
    var video = document.getElementById('monitor');
    var canvas = document.getElementById('photo');
    navigator.getUserMedia({video:true},
    function successCallback(stream) {
      // Replace the source of the video element with the stream from the camera
      if(navigator.getUserMedia==navigator.mozGetUserMedia) {
          video.src = stream;
      } else {
          video.src = window.URL.createObjectURL(stream) || stream;
      }
      video.onerror = function () {
        document.getElementById('errorMessage').textContent = 'Camera error.';
      }
      video.play();
      document.getElementById('splash').hidden = true;
      document.getElementById('app').hidden = false;
      $("#snapshotbutton").click(snapshot);
      $("#signup").click(signup);
    },
    function errorCallback(error) {
      document.getElementById('errorMessage').textContent = 'No camera available.';
    });

    function snapshot() {
      $("#result").html("<p><i>Authentication ongoing...</i></p>");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      var dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      socket.emit("login",dataUrl);
 
      
    }

    function signup() {
      $("#result").html("<p><i>Registration ongoing...</i></p>");
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
        document.getElementById('errorMessage').textContent = 'Please enter a name to signup';
        $("#result").html("");
      }
    }


    function handleResult(photo) {
      $("#result").html("");
      try{
        if(photo.tags[0].uids[0].confidence > 50){
          $("#app").html("<h2>Welcome "+photo.tags[0].uids[0].uid.split('@')[0]+" !</h2>");
          $("#result").html("");
          document.getElementById('errorMessage').textContent = '';
          document.getElementById('successMessage').textContent = '';
        }else{
          document.getElementById('errorMessage').textContent = 'Sorry you were not recognized';
        }
      }catch(e){
        document.getElementById('errorMessage').textContent = 'Sorry you were not recognized';
      }
      
    }

  } else {
    document.getElementById('errorMessage').textContent = 'No native camera support available.';
  }

}
init();