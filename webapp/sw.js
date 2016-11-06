self.addEventListener('push', function (event) {
  const obj = event.data.json();
  fireNotification(obj, event);
});

function fireNotification(obj, event) {
  const title = 'Yay \\o/';
  const body =  `something meaningful`;
  const icon = 'push-icon.png';
  const tag = 'push';

  event.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: icon,
    tag: tag
  }));
}