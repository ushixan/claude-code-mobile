// Preview Service Worker - Intercepts requests to bypass CORS and frame restrictions
const CACHE_NAME = 'preview-cache-v1';
const PROXY_PREFIX = '/__proxy__/';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[Preview SW] Installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Preview SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('preview-cache-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - intercept and proxy requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Check if this is a proxy request
  if (url.pathname.startsWith(PROXY_PREFIX)) {
    const targetUrl = url.pathname.slice(PROXY_PREFIX.length);
    const actualUrl = decodeURIComponent(targetUrl);
    
    console.log('[Preview SW] Proxying request:', actualUrl);
    
    event.respondWith(
      fetch(actualUrl, {
        method: event.request.method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0',
          'Accept': event.request.headers.get('Accept') || '*/*',
        },
        mode: 'cors',
        credentials: 'omit',
      })
      .then(async (response) => {
        // Clone the response to modify headers
        const headers = new Headers(response.headers);
        
        // Remove frame-blocking headers
        headers.delete('X-Frame-Options');
        headers.delete('Content-Security-Policy');
        headers.delete('X-Content-Type-Options');
        
        // Add CORS headers
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        headers.set('Access-Control-Allow-Headers', '*');
        
        // Handle HTML content to rewrite URLs
        if (response.headers.get('content-type')?.includes('text/html')) {
          const text = await response.text();
          const baseUrl = new URL(actualUrl);
          
          // Rewrite URLs in HTML to go through proxy
          const modifiedHtml = text
            // Rewrite absolute URLs
            .replace(/(?:href|src|action)="(https?:\/\/[^"]+)"/gi, (match, url) => {
              return match.replace(url, `${PROXY_PREFIX}${encodeURIComponent(url)}`);
            })
            // Rewrite root-relative URLs
            .replace(/(?:href|src|action)="(\/[^"]+)"/gi, (match, path) => {
              const fullUrl = `${baseUrl.origin}${path}`;
              return match.replace(path, `${PROXY_PREFIX}${encodeURIComponent(fullUrl)}`);
            })
            // Add base tag for relative URLs
            .replace(/<head[^>]*>/i, `$&<base href="${PROXY_PREFIX}${encodeURIComponent(baseUrl.origin + '/')}">`);
          
          return new Response(modifiedHtml, {
            status: response.status,
            statusText: response.statusText,
            headers: headers,
          });
        }
        
        // For non-HTML content, return as-is with modified headers
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers,
        });
      })
      .catch((error) => {
        console.error('[Preview SW] Proxy error:', error);
        
        // Return error page
        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview Error</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
              }
              .error-container {
                text-align: center;
                max-width: 500px;
              }
              h1 { font-size: 2em; margin-bottom: 0.5em; }
              p { font-size: 1.1em; opacity: 0.9; line-height: 1.6; }
              .error-details {
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                padding: 15px;
                margin-top: 20px;
                font-size: 0.9em;
                word-break: break-all;
              }
              .button {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: white;
                color: #667eea;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                transition: transform 0.2s;
              }
              .button:hover { transform: scale(1.05); }
            </style>
          </head>
          <body>
            <div class="error-container">
              <h1>⚠️ Preview Failed</h1>
              <p>Unable to load the requested page. This might be due to:</p>
              <ul style="text-align: left; display: inline-block;">
                <li>The site blocks embedding in iframes</li>
                <li>Network or connectivity issues</li>
                <li>Invalid or unreachable URL</li>
              </ul>
              <div class="error-details">
                <strong>URL:</strong> ${actualUrl}<br>
                <strong>Error:</strong> ${error.message}
              </div>
              <a href="${actualUrl}" target="_blank" class="button">Open in New Tab</a>
            </div>
          </body>
          </html>
        `;
        
        return new Response(errorHtml, {
          status: 500,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      })
    );
  }
});

// Message handler for controlling the service worker
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[Preview SW] Cache cleared');
    });
  }
});