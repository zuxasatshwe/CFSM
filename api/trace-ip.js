export default async function handler(req, res) {
  try {
    // Extract real client IP from reverse proxy and edge headers
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const vercelIp = req.headers['x-vercel-ip'];
    const cfIp = req.headers['cf-connecting-ip'];

    const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : null)
      || realIp
      || vercelIp
      || cfIp
      || req.socket?.remoteAddress
      || '127.0.0.1';

    // Vercel Geolocation headers
    const country = req.headers['x-vercel-ip-country'] || 'MM';
    const city = req.headers['x-vercel-ip-city'] || 'Yangon';
    const region = req.headers['x-vercel-ip-country-region'] || 'Yangon Region';
    const latitude = req.headers['x-vercel-ip-latitude'] || '16.8661';
    const longitude = req.headers['x-vercel-ip-longitude'] || '96.1951';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Known automated scanners and bot detection
    const suspiciousAgents = [
      /sqlmap/i, /nikto/i, /nmap/i, /gobuster/i, /masscan/i, 
      /dirbuster/i, /burpcollaborator/i, /wpscan/i, /zgrab/i, /curl\//i
    ];
    const isSuspicious = suspiciousAgents.some(rgx => rgx.test(userAgent));

    // Headers inspection for proxy or VPN
    const isProxy = Boolean(
      req.headers['via'] || 
      req.headers['x-forwarded-proto'] === 'http' || 
      req.headers['forwarded']
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.status(200).json({
      status: 'success',
      ip: clientIp,
      geo: {
        country: decodeURIComponent(country),
        city: decodeURIComponent(city),
        region: decodeURIComponent(region),
        lat: parseFloat(latitude) || 16.8661,
        lng: parseFloat(longitude) || 96.1951
      },
      client: {
        userAgent,
        isSuspicious,
        isProxy,
        threatScore: isSuspicious ? 85 : 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ status: 'error', message: 'Failed to inspect IP telemetry' });
  }
}
