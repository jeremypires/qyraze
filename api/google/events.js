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

export default async function handler(req, res) {

  if (req.method !== 'GET') {
    res.setHeader('Allow','GET');
    return res.status(405).json({
      error:'Method not allowed'
    });
  }

  try {

    const cookies = parseCookies(req.headers.cookie || '');
    const accessToken = cookies.google_access_token;

    if (!accessToken) {
      return res.status(401).json({
        error:'not_connected'
      });
    }

    const now = new Date();

    const inSevenDays = new Date();
    inSevenDays.setDate(inSevenDays.getDate()+7);

    const googleRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${inSevenDays.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=20`,
      {
        headers:{
          Authorization:`Bearer ${accessToken}`
        }
      }
    );

    const data = await googleRes.json();

    if (!googleRes.ok) {
      return res.status(googleRes.status).json(data);
    }

    return res.status(200).json({
      events:data.items || []
    });

  } catch(error){

    console.error(error);

    return res.status(500).json({
      error:'internal_error'
    });

  }

}