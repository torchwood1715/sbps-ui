console.log("Service Worker Loaded");

self.addEventListener("push", (event) => {
    console.log("Push event received", event);

    let data = {title: "New Notification", body: "Something happened!"};

    try {
        data = event.data.json();
    } catch (e) {
        console.error("Failed to parse push data", e);
    }

    const options = {
        body: data.body,
        icon: "/vite.svg",
        badge: "/vite.svg",
        data: {
            url: data.url || self.location.origin,
        },
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data.url || self.location.origin;

    event.waitUntil(
        clients.matchAll({type: "window"}).then((clientsArr) => {
            const hadWindowToFocus = clientsArr.some((windowClient) =>
                windowClient.url === urlToOpen ? (windowClient.focus(), true) : false
            );

            if (!hadWindowToFocus)
                clients.openWindow(urlToOpen).then((windowClient) => (windowClient ? windowClient.focus() : null));
        })
    );
});