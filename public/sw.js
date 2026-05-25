/**
 * sw.js — Service Worker para Sistema de Gestión de Convenios FM San Fernando
 *
 * Estrategias:
 *  - Shell estático (JS, CSS, fuentes, íconos): Cache-First
 *  - API de Supabase:                           Network-First con fallback a caché
 *  - Páginas HTML:                              Network-First con fallback offline
 */

const CACHE_VERSION = 'v1.0.0';
const SHELL_CACHE   = `shell-${CACHE_VERSION}`;
const API_CACHE     = `api-${CACHE_VERSION}`;
const IMAGE_CACHE   = `images-${CACHE_VERSION}`;

// Recursos del shell que se pre-cachean al instalar
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Dominios de API (no cachear con Cache-First)
const API_ORIGINS = [
  'supabase.co',
  'supabase.in',
];

// ─── Instalación ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      console.log('[SW] Pre-cacheando shell assets');
      return cache.addAll(SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ─── Activación: limpiar cachés antiguas ─────────────────────
self.addEventListener('activate', (event) => {
  const validCaches = [SHELL_CACHE, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !validCaches.includes(key))
          .map((key) => {
            console.log('[SW] Eliminando caché obsoleta:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Intercepción de fetch ────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar GET
  if (request.method !== 'GET') return;

  // Supabase API → Network-First
  if (API_ORIGINS.some((origin) => url.hostname.includes(origin))) {
    event.respondWith(networkFirstWithCache(request, API_CACHE, 30)); // TTL 30 min
    return;
  }

  // Imágenes → Cache-First con fallback
  if (request.destination === 'image') {
    event.respondWith(cacheFirstWithNetwork(request, IMAGE_CACHE));
    return;
  }

  // Recursos estáticos (.js, .css, fuentes) → Cache-First
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(cacheFirstWithNetwork(request, SHELL_CACHE));
    return;
  }

  // Navegación HTML → Network-First con offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }
});

// ─── Estrategias ─────────────────────────────────────────────

/** Network-First: intenta red, si falla usa caché */
async function networkFirstWithCache(request, cacheName, ttlMinutes = 60) {
  const cache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(request.clone());
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      // Añadir timestamp para TTL
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-fetched-on', Date.now().toString());
      cache.put(request, new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      }));
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      // Verificar TTL
      const fetchedOn = parseInt(cached.headers.get('sw-fetched-on') || '0');
      const ageMinutes = (Date.now() - fetchedOn) / 60000;
      if (ageMinutes < ttlMinutes) return cached;
    }
    return new Response(JSON.stringify({ error: 'Sin conexión', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/** Cache-First: sirve desde caché, actualiza en background */
async function cacheFirstWithNetwork(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    // Actualizar en background (stale-while-revalidate)
    fetch(request.clone()).then((res) => {
      if (res.ok) cache.put(request, res);
    }).catch(() => {});
    return cached;
  }
  try {
    const networkResponse = await fetch(request.clone());
    if (networkResponse.ok) cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch {
    return new Response('', { status: 404 });
  }
}

/** Navegación: Network-First con página offline de fallback */
async function navigationHandler(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    return (
      (await cache.match('/index.html')) ||
      (await cache.match('/offline.html')) ||
      new Response('<h1>Sin conexión</h1>', { headers: { 'Content-Type': 'text/html' } })
    );
  }
}

// ─── Push Notifications (base para alertas futuras) ──────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Convenios FM', {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: data.tag || 'convenios-fm',
      data: { url: data.url || '/' },
      actions: data.actions || [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existingClient = clientList.find((c) => c.url.includes(targetUrl) && 'focus' in c);
      if (existingClient) return existingClient.focus();
      return clients.openWindow(targetUrl);
    })
  );
});