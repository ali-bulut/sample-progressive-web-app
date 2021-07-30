var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var webpush = require("web-push");

var serviceAccount = require("./pwagram-firebase-pk.json");

admin.initializeApp({
  databaseURL: "https://u-pwagram-default-rtdb.firebaseio.com/",
  credential: admin.credential.cert(serviceAccount),
});

exports.storePostData = functions.https.onRequest(function (request, response) {
  cors(request, response, function () {
    admin
      .database()
      .ref("posts")
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image,
      })
      .then(function () {
        // (identifier for ourselves, publicKey, privateKey)
        webpush.setVapidDetails(
          "mailto:alibulut@yahoo.com",
          "BNN6jDDnBo3CeLvyJKq4ir2wBej5Xn8qeBEA3JkiszTekjo82YA6gRuvxxthz_DtFid-zQUBDBC64W9b5Wm4Pbc",
          "0VGHtXmwb3-usokDdFl_gcJUUIR4OrJkA7kQjXcE89M"
        );
        return admin.database().ref("subscriptions").once("value");
      })
      .then(function (subs) {
        subs.forEach(function (sub) {
          var pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh,
            },
          };
          webpush
            .sendNotification(
              pushConfig,
              JSON.stringify({
                title: "New Post",
                content: "New Post added!",
                openUrl: "/help",
              })
            )
            .catch(function (err) {
              console.log(err);
            });
        });
        response
          .status(201)
          .json({ message: "Data Stored", id: request.body.id });
      })
      .catch(function (err) {
        response.status(500).json({ error: err });
      });
  });
});
