const express = require('express')
const cors = require('cors')
const fs = require('fs')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

const readData = (file) =>
  JSON.parse(fs.readFileSync(`./data/${file}`, 'utf8'))

const writeData = (file, data) =>
  fs.writeFileSync(`./data/${file}`, JSON.stringify(data, null, 2))

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