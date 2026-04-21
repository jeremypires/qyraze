const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const session = require('express-session')
const { google } = require('googleapis')
require('dotenv').config()

const app = express()
const isProduction = process.env.NODE_ENV === 'production'
const corsOrigin = process.env.CORS_ORIGIN || true

if (isProduction) {
  app.set('trust proxy', 1)
}

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}))
app.use(express.json())
app.use(session({
  secret: process.env.SESSION_SECRET || 'qyraze-google-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}))
app.use(express.static('public'))

const googleRedirectUri =
  process.env.GOOGLE_REDIRECT_URI ||
  'http://localhost:3000/auth/google/callback'

const googleOauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri
)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/connexion', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  })
})

const startGoogleAuth = (req, res) => {
  const authUrl = googleOauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
  })

  res.redirect(authUrl)
}

app.get('/auth/google/start', startGoogleAuth)
app.get('/api/google/connect', startGoogleAuth)

app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code

  if (!code) {
    return res.status(400).send('Code Google manquant')
  }

  try {
    const { tokens } = await googleOauth2Client.getToken(code)
    googleOauth2Client.setCredentials(tokens)

    const oauth2 = google.oauth2({
      auth: googleOauth2Client,
      version: 'v2',
    })

    const { data: profile } = await oauth2.userinfo.get()

    req.session.googleTokens = tokens
    req.session.googleProfile = profile

    res.redirect('/app')
  } catch (error) {
    console.error('Google callback error:', error.message)
    res.status(500).send('Erreur lors de la connexion Google')
  }
})

app.get('/api/google/status', (req, res) => {
  res.json({
    connected: !!req.session.googleTokens,
    profile: req.session.googleProfile || null,
  })
})

app.get('/api/google/events', async (req, res) => {
  if (!req.session.googleTokens) {
    return res.status(401).json({ error: 'Google Calendar non connecté' })
  }

  try {
    googleOauth2Client.setCredentials(req.session.googleTokens)

    const calendar = google.calendar({
      version: 'v3',
      auth: googleOauth2Client,
    })

    const now = new Date()
    const endOfWeek = new Date(now)
    endOfWeek.setDate(now.getDate() + 7)

    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: endOfWeek.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 20,
    })

    res.json({
      events: data.items || [],
    })
  } catch (error) {
    console.error('Google events error:', error.message)
    res.status(500).json({ error: 'Impossible de récupérer les événements Google' })
  }
})

const logoutGoogle = (req, res) => {
  req.session.googleTokens = null
  req.session.googleProfile = null
  req.session.save(() => {
    res.json({ ok: true })
  })
}

app.post('/auth/google/logout', logoutGoogle)
app.post('/api/google/disconnect', logoutGoogle)

const readData = (file) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file), 'utf8'))

const writeData = (file, data) =>
  fs.writeFileSync(path.join(__dirname, 'data', file), JSON.stringify(data, null, 2))

app.get('/api/pipeline', (req, res) =>
  res.json(readData('pipeline.json')))

app.post('/api/pipeline', (req, res) => {
  writeData('pipeline.json', req.body)
  res.json({ ok: true })
})

app.get('/api/kpis', (req, res) =>
  res.json(readData('kpis.json')))

app.get('/api/tasks', (req, res) =>
  res.json(readData('tasks.json')))

app.post('/api/tasks', (req, res) => {
  writeData('tasks.json', req.body)
  res.json({ ok: true })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () =>
  console.log(`OS Pro actif → http://localhost:${PORT}`))
