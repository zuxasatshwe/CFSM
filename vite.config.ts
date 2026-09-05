import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

const devThreatCache: any[] = [];

function securityApiDevPlugin(): Plugin {
  return {
    name: 'security-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        if (url.startsWith('/api/trace-ip')) {
          const forwarded = req.headers['x-forwarded-for'];
          const clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null)
            || (req.headers['x-real-ip'] as string)
            || req.socket?.remoteAddress
            || '127.0.0.1';

          const userAgent = req.headers['user-agent'] || 'Unknown Browser';
          const suspiciousAgents = [
            /sqlmap/i, /nikto/i, /nmap/i, /gobuster/i, /masscan/i,
            /dirbuster/i, /burpcollaborator/i, /wpscan/i, /zgrab/i, /curl\//i
          ];
          const isSuspicious = suspiciousAgents.some(rgx => rgx.test(userAgent));
          const isProxy = Boolean(req.headers['via'] || req.headers['x-forwarded-proto'] === 'http');

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.setHeader('Access-Control-Allow-Origin', '*');

          res.end(JSON.stringify({
            status: 'success',
            ip: clientIp,
            geo: {
              country: 'Myanmar (Burma)',
              countryCode: 'MM',
              city: 'Yangon',
              region: 'Yangon Region',
              lat: 16.8661,
              lng: 96.1951,
              isp: 'MPT / Telenor / Ooredoo / Local Fiber Ingress'
            },
            client: {
              userAgent,
              isSuspicious,
              isProxy,
              threatScore: isSuspicious ? 85 : 0
            },
            timestamp: new Date().toISOString()
          }));
          return;
        }

        if (url.startsWith('/api/security-audit')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          const forwarded = req.headers['x-forwarded-for'];
          const clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null)
            || (req.headers['x-real-ip'] as string)
            || req.socket?.remoteAddress
            || '127.0.0.1';

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const data = body ? JSON.parse(body) : {};
                const incident = {
                  id: 'INC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
                  timestamp: new Date().toISOString(),
                  clientIp: data?.ip || clientIp,
                  eventType: data?.eventType || 'SUSPICIOUS_ACTIVITY',
                  severity: data?.severity || 'MEDIUM',
                  details: data?.details || 'Security threshold alert triggered',
                  userAgent: req.headers['user-agent'] || data?.userAgent || 'Unknown',
                  targetResource: data?.target || '/app',
                  actionTaken: data?.actionTaken || 'BLOCKED',
                  source: 'WAF_DEV_EDGE'
                };

                devThreatCache.unshift(incident);
                if (devThreatCache.length > 300) devThreatCache.pop();

                res.statusCode = 200;
                res.end(JSON.stringify({
                  status: 'recorded',
                  incidentId: incident.id,
                  clientIp,
                  recordedAt: incident.timestamp
                }));
              } catch (err) {
                res.statusCode = 400;
                res.end(JSON.stringify({ status: 'error', message: 'Malformed JSON payload' }));
              }
            });
            return;
          }

          res.statusCode = 200;
          res.end(JSON.stringify({
            status: 'ok',
            clientIp,
            totalIncidents: devThreatCache.length,
            recentIncidents: devThreatCache.slice(0, 50)
          }));
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), securityApiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
