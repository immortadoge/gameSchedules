import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The iOS app talked to these feeds directly. A browser can't: none of them
 * send permissive CORS headers for arbitrary origins, and vlr.gg serves HTML
 * that has to be scraped. So every upstream is reached through a same-origin
 * `/api/*` path that the Vite server proxies.
 *
 * Deploying the static bundle therefore also requires these five paths to be
 * proxied (nginx/CloudFront/Lambda@Edge/etc.) — see README.
 */
const proxy: Record<string, ProxyOptions> = {
  '/api/nba': {
    target: 'https://cdn.nba.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/nba/, ''),
  },
  '/api/mlb': {
    target: 'https://statsapi.mlb.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/mlb/, ''),
  },
  '/api/espn': {
    target: 'https://site.api.espn.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/espn/, ''),
  },
  '/api/lol': {
    target: 'https://esports-api.lolesports.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/lol/, ''),
  },
  '/api/vlr': {
    target: 'https://www.vlr.gg',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/vlr/, ''),
    headers: {
      // vlr.gg returns 403 to requests without a browser-ish User-Agent.
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
      Referer: 'https://www.vlr.gg/',
    },
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
