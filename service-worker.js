
"use strict";

const CACHE_NAME = "my-everyday-app-v1";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.webmanifest",
    "./icons/icon-180.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

// Install and cache the application files
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_FILES))
            .then(() => self.skipWaiting())
    );
});

// Activate and remove old application caches
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name =>
                            name.startsWith("my-everyday-app-") &&
                            name !== CACHE_NAME
                        )
                        .map(name => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Serve cached files and support offline navigation
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) return;

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put("./index.html", copy));
                    return response;
                })
                .catch(() => caches.match("./index.html"))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) return cachedResponse;

                return fetch(event.request).then(response => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, copy));
                    }
                    return response;
                });
            })
    );
});

// Receive future push notifications
self.addEventListener("push", event => {
    let notification = {
        title: "My Everyday",
        body: "You have a new reminder."
    };

    if (event.data) {
        try {
            notification = {
                ...notification,
                ...event.data.json()
            };
        } catch {
            notification.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: "./icons/icon-192.png",
            badge: "./icons/icon-192.png",
            data: {
                url: "./",
                ...(notification.data || {})
            }
        })
    );
});

// Open the application when a notification is clicked
self.addEventListener("notificationclick", event => {
    event.notification.close();

    const targetUrl = new URL(
        event.notification.data?.url || "./",
        self.location.origin
    ).href;

    event.waitUntil(
        self.clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then(clients => {
            for (const client of clients) {
                if (client.url === targetUrl && "focus" in client) {
                    return client.focus();
                }
            }

            return self.clients.openWindow(targetUrl);
        })
    );
});
