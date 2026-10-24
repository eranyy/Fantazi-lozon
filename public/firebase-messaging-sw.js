importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAYU35Cc-mewf1WAHjHUAcmq1ATntoU9YI",
  authDomain: "fantasy-luzon.firebaseapp.com",
  projectId: "fantasy-luzon",
  storageBucket: "fantasy-luzon.firebasestorage.app",
  messagingSenderId: "759769754748",
  appId: "1:759769754748:web:6e402c85c5bb4f9a3dadf9",
  measurementId: "G-D89L2G5PHL"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'התראה מפנטזי לוזון! ⚽';
  const customTag = payload.data?.tag || undefined;
  const isSilentScoreboard = customTag === 'luzon-live-scoreboard';

  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'לחץ כאן כדי להיכנס לליגה.',
    icon: '/app-icon.png', 
    badge: '/app-icon.png',
    dir: 'rtl',
    lang: 'he',
    ...(customTag ? { tag: customTag, renotify: !isSilentScoreboard, silent: isSilentScoreboard } : {}),
    data: { url: payload.data?.url || '/' }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// --- Asset & Image Caching Strategy for Maximum Speed ---
const CACHE_NAME = 'fantasy-luzon-v1';
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache images and static media with Stale-While-Revalidate
  const isImage = IMAGE_EXTENSIONS.some(ext => url.pathname.toLowerCase().endsWith(ext)) || event.request.destination === 'image';

  if (isImage && event.request.method === 'GET') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
  }
});