import * as fs from 'fs'
import * as path from 'path'

import { Express } from 'express'

export const loadRouters = (app: Express): void => {
  try {
    const distRoot = path.resolve(__dirname, '../..')
    const modulesDir = path.join(distRoot, 'modules')

    const isDevelopment = __filename.endsWith('.ts')
    const env = isDevelopment ? 'development (tsx)' : 'production (compiled)'
    const routerExtension = isDevelopment ? 'router.ts' : 'router.js'

    // eslint-disable-next-line no-console
    console.log(`📍 Environment: ${env}`)

    if (!fs.existsSync(modulesDir)) {
      return
    }

    const modulesList = fs.readdirSync(modulesDir, { withFileTypes: true })
    const moduleDirectories = modulesList.filter((item) => item.isDirectory())

    moduleDirectories.forEach((moduleDir) => {
      const modulePath = path.join(modulesDir, moduleDir.name)
      const routerPath = path.join(modulePath, routerExtension)

      if (!fs.existsSync(routerPath)) {
        return
      }

      try {
        const routerModule = require(routerPath)
        const router = routerModule.default || routerModule

        if (!router) {
          return
        }

        const routePath = `/api/${moduleDir.name}`
        app.use(routePath, router)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Failed to load router at ${routerPath}`, err)
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load routers:', error)
  }
}
