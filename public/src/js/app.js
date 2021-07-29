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
