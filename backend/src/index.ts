import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { keysRouter } from './routes/keys.js'
import { chatRouter } from './routes/chat.js'
import { generationRouter } from './routes/generation.js'
import { usageRouter } from './routes/usage.js'
import { settingsRouter } from './routes/settings.js'
import { providersRouter } from './routes/providers.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Serve generated images (go up one level from src/ to reach backend/ where public/images exists)
app.use('/images', express.static(join(__dirname, '../public/images')))

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
