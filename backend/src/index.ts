import express from 'express'
import cors from 'cors'
import { keysRouter } from './routes/keys.js'
import { chatRouter } from './routes/chat.js'
import { generationRouter } from './routes/generation.js'
import { usageRouter } from './routes/usage.js'
import { settingsRouter } from './routes/settings.js'
import { providersRouter } from './routes/providers.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// API Routes
app.use('/api/keys', keysRouter)
app.use('/api/chat', chatRouter)
app.use('/api/generation', generationRouter)
app.use('/api/usage', usageRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/providers', providersRouter)

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`KeyPilot backend running on http://localhost:${PORT}`)
})
