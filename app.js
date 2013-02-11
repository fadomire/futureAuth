var express = require("express"),
    request = require("request"),
    io = require('socket.io'),
    mongodb = require('mongodb'),
    BSON = require('mongodb').BSONPure;

  
var port = process.env.PORT || 8080,
    dbUri = process.env.MONGOLAB_URI || "mongodb://localhost:27017/futureAuth";


var faceKey = "replaceThiswithYourKey";
var faceSecret = "replaceThiswithYourKey";

var app = express()
  , server = require('http').createServer(app)
  , io = io.listen(server);


server.listen(port);

io.sockets.on('connection', function (socket) {
  socket.on('login', function (image) {
    var imageBase = image.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer(imageBase, 'base64');
    mongodb.MongoClient.connect(dbUri, {auto_reconnect: true}, function (error, db){
      console.log(error);
      var Users = db.collection("users")
      Users.distinct("_id",function (err, items){
        db.close();
        var usersCollection = items.join(",");
        console.log(usersCollection)
        request({
          url: 'http://api.skybiometry.com/fc/faces/recognize.json',
          headers: {
              'content-type' : 'multipart/form-data'
          },
          method: 'POST',
          multipart: [{ 
              'Content-Disposition' : 'form-data; name="file"; filename="temp.jpg"',
              'Content-Type' : 'image/jpeg',
              body: buf
          },{ 
              'Content-Disposition' : 'form-data; name="api_key";',
              body: faceKey
          },{ 
              'Content-Disposition' : 'form-data; name="api_secret";',
              body: faceSecret
          },{ 
              'Content-Disposition' : 'form-data; name="attributes";',
              body: "all"
          },{ 
              'Content-Disposition' : 'form-data; name="detector";',
              body: "Agressive"
          },{ 
              'Content-Disposition' : 'form-data; name="uids";',
              body: usersCollection
          },{ 
              'Content-Disposition' : 'form-data; name="namespace";',
              body: "futureAuth"
          }]
        }, 
        function(err, res, body){
          // convert json response to object
          var jsonResponse = JSON.parse(body);
          console.log(jsonResponse)
          try{
            console.log(jsonResponse.photos[0].tags[0].uids[0])
            if(jsonResponse.photos[0].tags[0].uids[0].confidence > 40){
              var userId = BSON.ObjectID.createFromHexString(jsonResponse.photos[0].tags[0].uids[0].uid.split("@")[0]);
              Users.findOne({_id: userId},function(err, doc) {
                  socket.emit("loginSuccess", doc.name);
              });
            }else{
              socket.emit("loginFail", "Sorry you were not recognized");
            }
          }catch(e){
            console.log("exception"+e)
            socket.emit("loginFail", "Sorry you were not recognized");
          }          
        });
      });
    })

});
  socket.on('signup', function (data) {
    console.log(data.username)
    mongodb.MongoClient.connect(dbUri, {auto_reconnect: true}, function (error, db){
      var Users = db.collection("users");
      Users.findOne({name: data.username}, function (err, item) {
        if(item){
          socket.emit("signupFailCallback", "Sorry username "+item.name+" is already taken");
        }else{
          var imageBase = data.image.replace(/^data:image\/\w+;base64,/, "");
          var buf = new Buffer(imageBase, 'base64');
          request({
            url: 'http://api.skybiometry.com/fc/faces/detect.json',
            method: 'POST',
            multipart: [{ 
                'Content-Disposition' : 'form-data; name="file"; filename="temp.jpg"',
                'Content-Type' : 'image/jpeg',
                body: buf
            },{ 
                'Content-Disposition' : 'form-data; name="api_key";',
                body: faceKey
            },{ 
                'Content-Disposition' : 'form-data; name="api_secret";',
                body: faceSecret
            },{ 
                'Content-Disposition' : 'form-data; name="attributes";',
                body: "all"
            },{ 
                'Content-Disposition' : 'form-data; name="detector";',
                body: "Agressive"
            }]
          }, 
          function (err, res, body){
            console.log(body)
            var jsonResponse = JSON.parse(body);
            // save the tag to API database
            try{
              if(jsonResponse.photos[0].tags[0].tid){
                Users.insert({name: data.username}, function (err, inserted) {
                  db.close();
                  if(err){
                    console.log("There was a problem saving this user"+err);
                  } else {
                    console.log("User inserted"+inserted[0]._id);
                    request('http://api.skybiometry.com/fc/tags/save.json?api_key='+faceKey
                      +'&api_secret='+faceSecret
                      +'&uid='+inserted[0]._id
                      +'@futureAuth&tids='+jsonResponse.photos[0].tags[0].tid
                      +'&label='+data.username
                      , function (error, response, body) {
                        console.log(body)
                        var jsonResponse = JSON.parse(body);
                      if (!error && response.statusCode == 200) {
                        request('http://api.skybiometry.com/fc/faces/train.json?api_key='+faceKey
                          +'&api_secret='+faceSecret
                          +'&uids='+inserted[0]._id+'@futureAuth'
                          , function (error, response, body) {
                            console.log(body)
                            var jsonResponse = JSON.parse(body);
                            if (!error && response.statusCode == 200) {
                              socket.emit("signupSuccessCallback", body);
                            }else{
                              socket.emit("signupFailCallback", "There was a problem with the request "+jsonResponse.error_message);

                            }
                        })
                      }else{
                        socket.emit("signupFailCallback", "There was a problem with the request "+jsonResponse.error_message);
                      }
                    })
                  }
                })
              }
            }catch(e){
              socket.emit("signupFailCallback", "Sorry your face was not detected properly, please retry");
            }
            
          });
        }
      });
    })

  });
});
app.set('view engine', 'ejs');
app.set("view options", {layout: false});
app.configure(function(){
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
});
app.get('/', function(req, res){
  res.render('index', {})
});
console.log('Listening on port 8080');
console.log(process.env.MONGOLAB_URI)