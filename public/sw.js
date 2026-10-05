self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = typeof payload.title === "string" ? payload.title : "LifeOS";
  const body = typeof payload.body === "string" ? payload.body : "Vous avez un rappel LifeOS.";
  const url = typeof payload.url === "string" ? payload.url : "/app/dashboard";
  const tag = typeof payload.tag === "string" ? payload.tag : "lifeos";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && typeof event.notification.data.url === "string"
    ? event.notification.data.url
    : "/app/dashboard";
  event.waitUntil(clients.openWindow(targetUrl));
});
