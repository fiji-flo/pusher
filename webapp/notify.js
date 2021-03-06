'use strict';
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function setUp(worker = 'sw.js') {
  Notification.requestPermission();
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.register(worker).then(reg => {
      reg.update();
      return reg.pushManager.getSubscription().then(subscription => {
        return subscription ? Promise.resolve(true) : Promise.resolve(false);
      });
    })
  } else {
    return Promise.reject(new Error('Service worker not supported'));
  }
}

function subscribePush(url, payload, key) {
  return navigator.serviceWorker.ready.then(reg => {
    return reg.pushManager.getSubscription().then(subscription => {
      if (!subscription) {
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key)
        }).then(subscription => {
          return postSubscribeObj(url, subscription, 'subscribe', payload);
        });
      } else {
        return Promise.resolve();
      }
    });
  });
}

function unsubscribePush(url) {
  return navigator.serviceWorker.ready.then(function (reg) {
    reg.pushManager.getSubscription().then(
      subscription => {
        postSubscribeObj(url, subscription, 'unsubscribe');
        if (!subscription) {
          return Promise.resolve();
        }
        return subscription.unsubscribe();
      });
  });
}

function remind(url, payload) {
  return navigator.serviceWorker.ready.then(reg => {
    return reg.pushManager.getSubscription().then(subscription => {
      return postSubscribeObj(url, subscription, 'remind', payload);
    });
  });
}

function postSubscribeObj(url, subscription, statusType, payload = {}) {
  const request = new XMLHttpRequest();

  request.open('POST', url);
  request.setRequestHeader('Content-Type', 'application/json');

  const subscribeObj = {
    statusType: statusType,
    subscription: subscription,
    data: payload,
  }
  const p = new Promise((resolve, reject) => {
    request.onload = () => request.status >= 200 && request.status <= 300 ?
      resolve() : reject();
    request.onerror = reject
  });

  request.send(JSON.stringify(subscribeObj));
  return p;
}

function onPushMessage(f) {
  navigator.serviceWorker.onmessage = m => f(m.data);
}
