import { Router } from 'express'
import { store } from '../dataStore.js'

export const usageRouter = Router()

// GET /api/usage - Get usage statistics
usageRouter.get('/', (_, res) => {
  try {
    const usage = store.usage.getAll()
    res.json({ success: true, data: usage })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch usage' })
  }
})
