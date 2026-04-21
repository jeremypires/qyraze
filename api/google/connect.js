function clearGoogleCalendarDisconnected() {
  localStorage.removeItem('google_calendar_disabled');
}
function persistQyrazeAccessTokenCookie(session) {
  const accessToken = session?.access_token;
  const isSecure = window.location.protocol === 'https:';

  if (!accessToken) {
    document.cookie = `qyraze_access_token=; Path=/; Max-Age=0; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    return;
  }

  document.cookie = `qyraze_access_token=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}
  
// ... assuming bootAuth function exists somewhere above or below in the file

  persistGoogleProviderToken(session);
  persistQyrazeAccessTokenCookie(session);

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    persistGoogleProviderToken(nextSession);
    persistQyrazeAccessTokenCookie(nextSession);
  });

// ... assuming disconnectGoogleBtn click handler exists somewhere in the file

    console.log('Cookie qyraze_access_token présent avant disconnect google:', document.cookie.includes('qyraze_access_token='));
    markGoogleCalendarDisconnected();

// ... assuming connectGoogleBtn click handler exists somewhere in the file

    console.log('Cookie qyraze_access_token présent avant connect google:', document.cookie.includes('qyraze_access_token='));
    clearGoogleCalendarDisconnected();