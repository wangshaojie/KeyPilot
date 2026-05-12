import { Router } from 'express'
import { store } from '../dataStore.js'

export const settingsRouter = Router()

// GET /api/settings - Get settings
settingsRouter.get('/', (_, res) => {
  try {
    const settings = store.settings.get()
    res.json({ success: true, data: settings })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' })
  }
})

// POST /api/settings - Update settings
settingsRouter.post('/', (req, res) => {
  try {
    const updates = req.body
    const settings = store.settings.update(updates)
    res.json({ success: true, data: settings })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update settings' })
  }
})
