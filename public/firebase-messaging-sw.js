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
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'לחץ כאן כדי להיכנס לליגה.',
    icon: '/app-icon.png', 
    badge: '/app-icon.png',
    data: { url: '/' }
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