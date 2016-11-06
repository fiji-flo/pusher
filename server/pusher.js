const webPush = require("web-push");

const subscribers = new Map();

function notifier() {
  for (let sub of subscribers.values()) {
    console.log(`pushing to ${JSON.stringify(sub.subscription)} -> ${JSON.stringify(sub.data)}`)
    webPush.sendNotification(sub.subscription, JSON.stringify({
      action: "warning",
      temp: -1,
      zip: sub.data.zip,
    }))
  }
}

function pushHandler(request, response) {
  let body = "";

  request.on("data", function (chunk) {
    body += chunk;
  });

  request.on("end", function () {
    if (!body) return;
    const obj = JSON.parse(body);
    const subscriber =  { subscription: obj.subscription, data: obj.data };
    console.log("POSTed: " + obj.statusType);
    switch (obj.statusType) {
      case "subscribe":
        console.log(`new subscriber: ${obj.subscription}`);
        subscribers.set(obj.subscription.endpoint, subscriber);
        break;
      case "unsubscribe":
        console.log(`lost subscriber: ${obj.subscription}`);
        subscribers.delete(obj.subscription.endpoint);
        break;
    }
  });

  response.writeHead(200, {
    "Content-Type": "application/json",
  });

  response.end();
}


setInterval(notifier, 10000);

module.exports.pushHandler = pushHandler;