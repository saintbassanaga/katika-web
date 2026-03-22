const BACKEND_URL = 'https://api.katica.app';
const BACKEND_HOST = 'api.katica.app';
const PROXY_PREFIXES = ['/bff/', '/api/', '/ws/'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (PROXY_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
      const backendUrl = BACKEND_URL + url.pathname + url.search;
      const headers = new Headers(request.headers);
      headers.set('Host', BACKEND_HOST);

      // Transmet l'IP réelle du client pour le rate limiting côté Spring
      const clientIp = request.headers.get('CF-Connecting-IP');
      if (clientIp) headers.set('X-Forwarded-For', clientIp);
      headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

      const isWebSocket = request.headers.get('Upgrade') === 'websocket';

      // WebSocket upgrade : forward direct sans body ni redirect manipulation
      // Cloudflare établit le bridge TCP automatiquement si l'origine répond 101
      if (isWebSocket) {
        return fetch(new Request(backendUrl, { headers, method: 'GET' }));
      }

      const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

      const proxyRequest = new Request(backendUrl, {
        method: request.method,
        headers,
        body: hasBody ? request.body : undefined,
        // duplex requis quand body est un ReadableStream (uploads)
        ...(hasBody ? { duplex: 'half' } : {}),
        redirect: 'follow',
      });

      return fetch(proxyRequest);
    }

    return env.ASSETS.fetch(request);
  },
};
