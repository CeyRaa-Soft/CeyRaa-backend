import { Express } from 'express'
import adminRouter from '@/modules/admin/router'

export const loadRouters = (app: Express): void => {
  // eslint-disable-next-line no-console
  console.log('📍 Loading static routers')

  // Register the admin hub API routes statically so Vercel can trace and bundle them
  app.use('/api/admin', adminRouter)
}
