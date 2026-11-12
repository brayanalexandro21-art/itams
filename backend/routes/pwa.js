const express = require('express');
const router = express.Router();
const path = require('path');

// PWA Manifest
router.get('/manifest.json', (req, res) => {
  const manifest = {
    name: 'ITAMS - IT Asset Management',
    short_name: 'ITAMS',
    description: 'Complete IT Asset Management System',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    categories: ['business', 'productivity'],
    screenshots: [],
    prefer_related_applications: false,
  };

  res.json(manifest);
});

// Service Worker
router.get('/sw.js', (req, res) => {
  const sw = `
    const CACHE_NAME = 'itams-v1';
    const urlsToCache = [
      '/',
      '/index.html',
      '/static/js/bundle.js',
      '/static/css/main.css',
    ];

    self.addEventListener('install', (event) => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then((cache) => cache.addAll(urlsToCache))
      );
    });

    self.addEventListener('fetch', (event) => {
      event.respondWith(
        caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            return fetch(event.request);
          })
      );
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.filter((cacheName) => {
              return cacheName !== CACHE_NAME;
            }).map((cacheName) => {
              return caches.delete(cacheName);
            })
          );
        })
      );
    });

    // Push notification handling
    self.addEventListener('push', (event) => {
      const data = event.data ? event.data.json() : {};
      const title = data.title || 'ITAMS Notification';
      const options = {
        body: data.body || 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: data.url || '/',
      };

      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    });

    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      event.waitUntil(
        clients.openWindow(event.notification.data)
      );
    });
  `;

  res.setHeader('Content-Type', 'application/javascript');
  res.send(sw);
});

// Offline fallback
router.get('/offline.html', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ITAMS - Offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background-color: #f3f4f6;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 { color: #4f46e5; margin-bottom: 1rem; }
        p { color: #6b7280; }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>You're Offline</h1>
        <p>Please check your internet connection and try again.</p>
        <p>Some features may be available offline.</p>
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = router;
