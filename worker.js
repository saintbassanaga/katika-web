const BACKEND = 'http://api.katica.app:8080';
const PROXY_PREFIXES = ['/bff/', '/api/', '/ws/'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (PROXY_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
      const backendUrl = BACKEND + url.pathname + url.search;
      const proxyRequest = new Request(backendUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        redirect: 'follow',
      });
      return fetch(proxyRequest);
    }

    return env.ASSETS.fetch(request);
  },
};
