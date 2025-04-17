caches.open("assets")
.then(cache => {
    cache.addAll([
        "/app/index.html",
        "/app/",
        "/app",
        "/assets/icons/icon.svg"
    ]);
});