var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var webpush = require("web-push");
var fs = require("fs");
var UUID = require("uuid");
var os = require("os");
var Busboy = require("busboy");
var path = require("path");

var serviceAccount = require("./pwagram-firebase-pk.json");

var gcconfig = {
  projectId: "u-pwagram",
  keyFilename: "pwagram-firebase-pk.json",
};

var gcs = require("@google-cloud/storage")(gcconfig);

admin.initializeApp({
  databaseURL: "https://u-pwagram-default-rtdb.firebaseio.com/",
  credential: admin.credential.cert(serviceAccount),
});

exports.storePostData = functions.https.onRequest(function (request, response) {
  cors(request, response, function () {
    var uuid = UUID.v4();

    var busboy = new Busboy({ headers: request.headers });
    // These objects will store the values (file + fields) extracted from busboy
    var upload;
    var fields = {};

    // This callback will be invoked for each file uploaded
    busboy.on("file", function (fieldname, file, filename, encoding, mimetype) {
      //   console.log(
      //     `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
      //   );
      var filepath = path.join(os.tmpdir(), filename);
      upload = { file: filepath, type: mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });

    // This will invoked on every field detected
    busboy.on(
      "field",
      function (
        fieldname,
        val,
        fieldnameTruncated,
        valTruncated,
        encoding,
        mimetype
      ) {
        fields[fieldname] = val;
      }
    );

    // This callback will be invoked after all uploaded files are saved.
    busboy.on("finish", function () {
      var bucket = gcs.bucket("u-pwagram.appspot.com");
      bucket.upload(
        upload.file,
        {
          uploadType: "media",
          metadata: {
            metadata: {
              contentType: upload.type,
              firebaseStorageDownloadTokens: uuid,
            },
          },
        },
        function (err, uploadedFile) {
          if (!err) {
            admin
              .database()
              .ref("posts")
              .push({
                id: fields.id,
                title: fields.title,
                location: fields.location,
                image:
                  "https://firebasestorage.googleapis.com/v0/b/" +
                  bucket.name +
                  "/o/" +
                  encodeURIComponent(uploadedFile.name) +
                  "?alt=media&token=" +
                  uuid,
              })
              .then(function () {
                webpush.setVapidDetails(
                  "mailto:alibulut@yahoo.com",
                  "BNN6jDDnBo3CeLvyJKq4ir2wBej5Xn8qeBEA3JkiszTekjo82YA6gRuvxxthz_DtFid-zQUBDBC64W9b5Wm4Pbc",
                  "0VGHtXmwb3-usokDdFl_gcJUUIR4OrJkA7kQjXcE89M"
                );
                return admin.database().ref("subscriptions").once("value");
              })
              .then(function (subscriptions) {
                subscriptions.forEach(function (sub) {
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
                  .json({ message: "Data stored", id: fields.id });
              })
              .catch(function (err) {
                response.status(500).json({ error: err });
              });
          } else {
            console.log(err);
          }
        }
      );
    });

    // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
    // a callback when it's finished.
    busboy.end(request.rawBody);
    // formData.parse(request, function(err, fields, files) {
    //   fs.rename(files.file.path, "/tmp/" + files.file.name);
    //   var bucket = gcs.bucket("YOUR_PROJECT_ID.appspot.com");
    // });

    // it was commented out after getting image from client operation.
    // admin
    //   .database()
    //   .ref("posts")
    //   .push({
    //     id: request.body.id,
    //     title: request.body.title,
    //     location: request.body.location,
    //     image: request.body.image,
    //   })
    //   .then(function () {
    //     // (identifier for ourselves, publicKey, privateKey)
    //     webpush.setVapidDetails(
    //       "mailto:alibulut@yahoo.com",
    //       "BNN6jDDnBo3CeLvyJKq4ir2wBej5Xn8qeBEA3JkiszTekjo82YA6gRuvxxthz_DtFid-zQUBDBC64W9b5Wm4Pbc",
    //       "0VGHtXmwb3-usokDdFl_gcJUUIR4OrJkA7kQjXcE89M"
    //     );
    //     return admin.database().ref("subscriptions").once("value");
    //   })
    //   .then(function (subs) {
    //     subs.forEach(function (sub) {
    //       var pushConfig = {
    //         endpoint: sub.val().endpoint,
    //         keys: {
    //           auth: sub.val().keys.auth,
    //           p256dh: sub.val().keys.p256dh,
    //         },
    //       };
    //       webpush
    //         .sendNotification(
    //           pushConfig,
    //           JSON.stringify({
    //             title: "New Post",
    //             content: "New Post added!",
    //             openUrl: "/help",
    //           })
    //         )
    //         .catch(function (err) {
    //           console.log(err);
    //         });
    //     });
    //     response
    //       .status(201)
    //       .json({ message: "Data Stored", id: request.body.id });
    //   })
    //   .catch(function (err) {
    //     response.status(500).json({ error: err });
    //   });
  });
});
