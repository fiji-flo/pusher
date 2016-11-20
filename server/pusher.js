'use strict';
const webPush = require('web-push');
const sqlite3 = require('sqlite3');
const jsonfile = require('jsonfile');

const DB_FILE = 'subscriptions.sqlite3';
const VAPID_FILE = 'vapid.json';
const subscribers = new Map();

const vapidInfo = jsonfile.readFileSync(VAPID_FILE);
webPush.setVapidDetails(vapidInfo.email, vapidInfo.publicKey, vapidInfo.privateKey);

const db = new sqlite3.Database(DB_FILE);
function initDB() {
  db.run('CREATE TABLE IF NOT EXISTS subscribers (subs TEXT, CONSTRAINT uni UNIQUE (subs))');
  db.all('SELECT * FROM subscribers', (err, rows=[]) => {
    for (let row of rows) {
      const subscriber = JSON.parse(row.subs);
      console.log(`restored ${subscriber.subscription.endpoint}`);
      subscribers.set(subscriber.subscription.endpoint, subscriber);
    }
  });
}

initDB();

function addNotifier(subscriber) {

}

function addSubscriber(subscriber) {
  const sql = `INSERT INTO subscribers VALUES ('${JSON.stringify(subscriber)}')`;
  console.log(sql);
  db.run(sql);
  subscribers.set(subscriber.subscription.endpoint, subscriber);
}

function deleteSubscriber(subscriber) {
  const sql = `DELETE FROM subscribers WHERE subs = '${JSON.stringify(subscriber)}'`;
  console.log(sql);
  db.run(sql);
  subscribers.delete(subscriber.subscription.endpoint);
}

function notifier() {
  for (let sub of subscribers.values()) {
    console.log(`pushing to ${JSON.stringify(sub.subscription)} -> ${JSON.stringify(sub.data)}`)
    webPush.sendNotification(sub.subscription, JSON.stringify({
      title: `\\o/ Yay`,
      body: `something blue!`,
    }))
  }
}

// relies on body-parser
function pushHandler(request, response) {
  const obj = request.body;
  const subscriber =  { subscription: obj.subscription, data: obj.data };
  console.log('POSTed: ' + obj.statusType);
  switch (obj.statusType) {
  case 'subscribe':
    console.log(`new subscriber: ${subscriber.subscription.endpoint}`);
    addSubscriber(subscriber);
    break;
  case 'unsubscribe':
    console.log(`lost subscriber: ${subscriber.subscription.endpoint}`);
    deleteSubscriber(subscriber);
    break;
  }
  response.end();
}


setInterval(notifier, 10000);

module.exports.pushHandler = pushHandler;
