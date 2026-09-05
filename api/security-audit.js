// Serverless Threat and Audit Event Collector
const threatCache = [];

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : null)
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || '127.0.0.1';

  if (req.method === 'POST') {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const incident = {
        id: 'INC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        timestamp: new Date().toISOString(),
        clientIp: data?.ip || clientIp,
        eventType: data?.eventType || 'SUSPICIOUS_ACTIVITY',
        severity: data?.severity || 'MEDIUM', // INFO, LOW, MEDIUM, HIGH, CRITICAL
        details: data?.details || 'Security threshold alert triggered',
        userAgent: req.headers['user-agent'] || data?.userAgent || 'Unknown',
        targetResource: data?.target || '/app',
        actionTaken: data?.actionTaken || 'BLOCKED',
        source: 'WAF_EDGE'
      };

      threatCache.unshift(incident);
      if (threatCache.length > 300) threatCache.pop();

      return res.status(200).json({
        status: 'recorded',
        incidentId: incident.id,
        clientIp,
        recordedAt: incident.timestamp
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: 'Malformed security event payload' });
    }
  }

  // GET: Return recent incidents and current client IP info
  return res.status(200).json({
    status: 'ok',
    clientIp,
    totalIncidents: threatCache.length,
    recentIncidents: threatCache.slice(0, 50)
  });
}
