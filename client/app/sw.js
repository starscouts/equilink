self.addEventListener("install", installEvent => {
    installEvent.waitUntil(
        () => {
            Notification.requestPermission().then((result) => {
                if (result === "granted") {
                    console.log("Notification granted")
                }
            })
        }
    )
})

self.addEventListener("fetch", (e) => {
    e.respondWith(
        (async () => {
            const r = await caches.match(e.request);
            console.log(`[Service Worker] ${r ? "Loading resource from cache" : "Fetching resource on network"}: ${e.request.url}`);
            if (r) {
                return r;
            }
            const response = await fetch(e.request);
            return response;
        })()
    );
});
