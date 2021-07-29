var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll(
  ".enable-notifications"
);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(function () {
    console.log("Service worker registered!");
  });
}

window.addEventListener("beforeinstallprompt", function (event) {
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
  if ("serviceWorker" in navigator) {
    var options = {
      body: "You successfully subscribed to our Notification Service.",
      icon: "/src/images/icons/app-icon-96x96.png",
      image: "/src/images/sf-boat.jpg",
      dir: "ltr", // default
      lang: "en-US",
      // vibrate 100 ms, pause 50 ms and vibrate again for 200 ms
      vibrate: [100, 50, 200],
      badge: "/src/images/icons/app-icon-96x96.png",
      tag: "confirm-notification", // works like id, by using it we are able to send notifications whose tag name's are same as stack(bunch).
      // if it is set to true, that means notifications that have same tag will vibrate device. Default is false and that means
      // if 5 notifications sent to device with same tag, it will only vibrate for once. But if is set to true, it will vibrate 5 times.
      renotify: false,
      // that enables to show buttons below the notification message.
      actions: [
        {
          action: "confirm",
          title: "Okay",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
        {
          action: "cancel",
          title: "Cancel",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
      ],
    };

    navigator.serviceWorker.ready.then(function (swreg) {
      swreg.showNotification("Successfully Subscribed!", options);
    });
  }
  // new Notification("Successfully Subscribed!", options);
}

function askForNotificationPermission() {
  Notification.requestPermission(function (result) {
    console.log("User Choice", result);
    if (result !== "granted") {
      console.log("No notification permission granted!");
    } else {
      displayConfirmNotification();
    }
  });
}

if ("Notification" in window) {
  for (let i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = "inline-block";
    enableNotificationsButtons[i].addEventListener(
      "click",
      askForNotificationPermission
    );
  }
}
