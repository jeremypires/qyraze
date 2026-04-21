

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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method not allowed');
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return res.redirect(`/app?google_error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.redirect('/app?google_error=missing_code_or_state');
    }

    const cookies = parseCookies(req.headers.cookie || '');
    const expectedState = cookies.google_oauth_state;
    const userId = cookies.qyraze_user_id;

    if (!expectedState || state !== expectedState) {
      return res.redirect('/app?google_error=invalid_state');
    }

    if (!userId) {
      return res.redirect('/app?google_error=missing_user');
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    console.log('TOKENS GOOGLE', tokenData);

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Erreur échange token Google:', tokenData);
      return res.redirect('/app?google_error=token_exchange_failed');
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    const profileData = await profileRes.json();
    const googleEmail = profileData.email || null;
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const upsertPayload = {
      user_id: userId,
      google_email: googleEmail,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    };

    const supabaseRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/google_calendar_connections?on_conflict=user_id`,
      {
        method: 'POST',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify(upsertPayload)
      }
    );

    if (!supabaseRes.ok) {
      const supabaseError = await supabaseRes.text();
      console.error('Erreur upsert google_calendar_connections:', supabaseError);
      return res.redirect('/app?google_error=db_upsert_failed');
    }

    res.setHeader('Set-Cookie', [
      buildSetCookie('google_oauth_state', '', {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        maxAge: 0
      }),
      buildSetCookie('google_calendar_connected', '1', {
        path: '/',
        secure: true,
        sameSite: 'Lax',
        maxAge: 60 * 60 * 24 * 30
      })
    ]);

    return res.redirect('/app?google_connected=1');
  } catch (err) {
    console.error('Erreur /api/google/callback:', err);
    return res.redirect('/app?google_error=internal_callback_error');
  }
}