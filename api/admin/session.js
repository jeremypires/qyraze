import crypto from 'crypto';

const COOKIE_NAME = 'qyraze_admin_session';

function sign(value) {
  return crypto
    .createHmac('sha256', process.env.ADMIN_SECRET)
    .update(value)
    .digest('hex');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));

  if (left.length !== right.length) return false;

  return crypto.timingSafeEqual(left, right);
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (!target) return null;

  return decodeURIComponent(target.slice(name.length + 1));
}

function clearAdminCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    if (!process.env.ADMIN_SECRET) {
      return res.status(500).json({ error: 'Configuration serveur manquante' });
    }

    const session = getCookie(req, COOKIE_NAME);

    if (!session || typeof session !== 'string') {
      return res.status(401).json({ authenticated: false });
    }

    const parts = session.split('.');

    if (parts.length !== 2) {
      clearAdminCookie(res);
      return res.status(401).json({ authenticated: false });
    }

    const [encodedPayload, signature] = parts;

    if (!encodedPayload || !signature) {
      clearAdminCookie(res);
      return res.status(401).json({ authenticated: false });
    }

    const expectedSignature = sign(encodedPayload);

    if (!safeEqual(signature, expectedSignature)) {
      clearAdminCookie(res);
      return res.status(401).json({ authenticated: false });
    }

    let payload;

    try {
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    } catch {
      clearAdminCookie(res);
      return res.status(401).json({ authenticated: false });
    }

    if (
      !payload ||
      typeof payload !== 'object' ||
      !payload.exp ||
      typeof payload.exp !== 'number' ||
      Date.now() > payload.exp ||
      payload.role !== 'admin'
    ) {
      clearAdminCookie(res);
      return res.status(401).json({ authenticated: false });
    }

    return res.status(200).json({
      authenticated: true,
      email: payload.email || null,
    });
  } catch (error) {
    console.error('Admin session error:', error);
    return res.status(500).json({ error: 'Erreur session admin' });
  }
}
