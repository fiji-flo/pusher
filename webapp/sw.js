self.addEventListener('push', function (event) {
  const obj = event.data.json();
  fireNotification(obj, event);
});

function fireNotification(obj, event) {
  const title = obj.title;
  const body =  obj.body;
  const icon = 'images/pusher-icon-192.png';
  const tag = 'push';

  event.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: icon,
    tag: tag
  }));
}
