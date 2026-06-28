import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const COOKIE_NAME = 'qyraze_admin_session';
const MAX_LEADS = 500;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
  );
}

function verifyAdminSession(req, res) {
  const session = getCookie(req, COOKIE_NAME);

  if (!session || typeof session !== 'string') return null;

  const parts = session.split('.');

  if (parts.length !== 2) {
    clearAdminCookie(res);
    return null;
  }

  const [encodedPayload, signature] = parts;

  if (!encodedPayload || !signature) {
    clearAdminCookie(res);
    return null;
  }

  const expectedSignature = sign(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    clearAdminCookie(res);
    return null;
  }

  let payload;

  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    clearAdminCookie(res);
    return null;
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
    return null;
  }

  return payload;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    if (
      !process.env.ADMIN_SECRET ||
      !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return res.status(500).json({ error: 'Configuration serveur manquante' });
    }

    const adminSession = verifyAdminSession(req, res);

    if (!adminSession) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('waitlist_leads')
      .select('id,name,email,created_at,verified_at,consent,subscribed,deleted,unsubscribed_at')
      .not('verified_at', 'is', null)
      .eq('consent', true)
      .eq('subscribed', true)
      .eq('deleted', false)
      .is('unsubscribed_at', null)
      .order('created_at', { ascending: false })
      .limit(MAX_LEADS);

    if (error) {
      console.error('Admin leads fetch error:', error.message || error);
      return res.status(500).json({ error: 'Erreur récupération leads' });
    }

    const leads = (data || [])
      .filter((lead) => lead?.email)
      .map((lead) => ({
        id: lead.id,
        name: lead.name ? String(lead.name).trim() : null,
        email: String(lead.email).toLowerCase().trim(),
        created_at: lead.created_at || null,
      }));

    return res.status(200).json({
      success: true,
      total: leads.length,
      leads,
    });
  } catch (error) {
    console.error('Admin leads error:', error?.message || error);
    return res.status(500).json({ error: 'Erreur serveur leads' });
  }
}