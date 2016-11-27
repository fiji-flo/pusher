'use strict';
const fs = require('fs');
const webPush = require('web-push');
const sqlite3 = require('sqlite3');
const jsonfile = require('jsonfile');
const cronie = require('./cronie.js')

const DB_FILE = 'subscriptions.sqlite3';
const VAPID_FILE = 'vapid.json';
const subscribers = new Map();

if (fs.existsSync(VAPID_FILE)) {
  const vapidInfo = jsonfile.readFileSync(VAPID_FILE);
  webPush.setVapidDetails(vapidInfo.email, vapidInfo.publicKey, vapidInfo.privateKey);
}

const db = new sqlite3.Database(DB_FILE);
function initDB() {
  db.run('CREATE TABLE IF NOT EXISTS subscribers (subs TEXT, CONSTRAINT uni UNIQUE (subs))');
  db.run('CREATE TABLE IF NOT EXISTS reminders (endpoint TEXT, reminder TEXT)');
  db.all('SELECT * FROM subscribers', (err, rows=[]) => {
    for (let row of rows) {
      const subscriber = JSON.parse(row.subs);
      console.log(`restored ${subscriber.subscription.endpoint}`);
      subscribers.set(subscriber.subscription.endpoint, subscriber);
    }
  });
  db.all('SELECT * FROM reminders', (err, rows=[]) => {
    for (let row of rows) {
      const endpoint = JSON.parse(row.endpoint);
      const reminder = JSON.parse(row.reminder);
      const subscriber = subscribers.get(endpoint);
      console.log(`got ${JSON.stringify(subscriber || {})}`);
      if (subscriber) {
        cronie.add(reminder.ts, () => notify(subscriber, reminder))
        console.log(`restored reminder ${JSON.stringify(reminder)} for ${endpoint}`);
      }
    }
  });
}

initDB();

function addReminder(subscriber, reminder) {
  const endpointStr = JSON.stringify(subscriber.subscription.endpoint);
  const reminderStr = JSON.stringify(reminder);
  const sql = `INSERT INTO reminders VALUES ('${endpointStr}', '${reminderStr}')`;
  db.run(sql);
  cronie.add(reminder.ts, () => notify(subscriber, reminder))
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

function notify(sub, reminder) {
  console.log(`pushing to ${JSON.stringify(sub.subscription)} -> ${JSON.stringify(reminder)}`)
  webPush.sendNotification(sub.subscription, JSON.stringify({
    title: reminder.title,
    body: reminder.body,
  }))
}

// relies on body-parser
function pushHandler(request, response) {
  const obj = request.body;
  const subscriber =  { subscription: obj.subscription };
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
  case 'remind':
    console.log(`new reminder for: ${subscriber.subscription.endpoint}`);
    addReminder(subscriber, obj.data);
  }
  response.writeHead(200, {
    'Content-Type': 'application/json',
  });
  response.end();
}

module.exports.pushHandler = pushHandler;
