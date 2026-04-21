function parseCookies(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const eqIndex = part.indexOf('=');
        if (eqIndex === -1) return [part, ''];
        const key = part.slice(0, eqIndex);
        const value = decodeURIComponent(part.slice(eqIndex + 1));
        return [key, value];
      })
  );
}

function buildSetCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (typeof options.maxAge === 'number') parts.push(`Max-Age=${options.maxAge}`);
  return parts.join('; ');
}

function randomState() {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method not allowed');
  }

  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const accessToken = cookies.qyraze_access_token;

    if (!accessToken) {
      return res.redirect('/connexion?google_error=missing_auth_session');
    }

    const userRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`
      }
    });

    const user = await userRes.json();

    if (!userRes.ok || !user?.id) {
      console.error('Impossible de récupérer l’utilisateur Supabase:', user);
      return res.redirect('/connexion?google_error=invalid_auth_session');
    }

    const state = randomState();
    const isLocal = (req.headers.host || '').includes('localhost');
    const secureCookie = !isLocal;

    res.setHeader('Set-Cookie', [
      buildSetCookie('google_oauth_state', state, {
        path: '/',
        httpOnly: true,
        secure: secureCookie,
        sameSite: 'Lax',
        maxAge: 60 * 10
      }),
      buildSetCookie('qyraze_user_id', user.id, {
        path: '/',
        httpOnly: true,
        secure: secureCookie,
        sameSite: 'Lax',
        maxAge: 60 * 10
      })
    ]);

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/calendar.readonly'
      ].join(' '),
      state
    });

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (error) {
    console.error('Erreur /api/google/connect:', error);
    return res.redirect('/app?google_error=connect_failed');
  }
}