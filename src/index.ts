/* eslint-disable no-console */
// Load env first so that all subsequent imports have access to environment variables immediately
import './load-env'

// Path resolver setup - MUST be at the very top before any other imports
import 'module-alias/register'
import * as path from 'path'

import type { ErrorRequestHandler } from 'express'
import * as moduleAlias from 'module-alias'

// Set up path aliases for the compiled JavaScript
moduleAlias.addAliases({
  '@': path.join(__dirname),
  '@schemas': path.join(__dirname, 'schemas'),
  '@common': path.join(__dirname, 'common'),
  '@modules': path.join(__dirname, 'modules'),
  '@services': path.join(__dirname, 'common/services')
})

// Your existing imports
import express from 'express'
import cors from 'cors'

import connectDB from './common/services/db.service'
import { loadRouters } from './common/services/loadRouters.service'
import { errorHandler } from './middleware/error.middleware'

const app = express()
app.use(cors())
app.use(express.json())

// Custom Logger Middleware to print api hits in the terminal
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// Root health check route (responds to http://localhost:3001/health)
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

connectDB()

// Auto-load all module routers
loadRouters(app)

// Global error handler
app.use(errorHandler as ErrorRequestHandler)

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}

export default app
