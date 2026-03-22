const BACKEND_IP = 'https://api.katica.app';
const BACKEND_HOST = 'api.katica.app';
const PROXY_PREFIXES = ['/bff/', '/api/', '/ws/'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (PROXY_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
      const backendUrl = BACKEND_IP + url.pathname + url.search;
      const headers = new Headers(request.headers);
      headers.set('Host', BACKEND_HOST);
      const proxyRequest = new Request(backendUrl, {
        method: request.method,
        headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        redirect: 'follow',
      });
      return fetch(proxyRequest);
    }

    return env.ASSETS.fetch(request);
  },
};
