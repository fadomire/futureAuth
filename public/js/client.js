function init() {
  var socket = io.connect(window.location.hostname);
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
  if (navigator.webkitGetUserMedia) {

    navigator.webkitGetUserMedia({video:true}, gotStream, noStream);

    var video = document.getElementById('monitor');
    var canvas = document.getElementById('photo');

    function gotStream(stream) {

      video.src = webkitURL.createObjectURL(stream);
      video.onerror = function () {
        stream.stop();
        streamError();
      };
      document.getElementById('splash').hidden = true;
      document.getElementById('app').hidden = false;
      $("#snapshotbutton").click(snapshot);
      $("#signup").click(signup);
    }

    function noStream() {
      document.getElementById('errorMessage').textContent = 'No camera available.';
    }

    function streamError() {
      document.getElementById('errorMessage').textContent = 'Camera error.';
    }

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