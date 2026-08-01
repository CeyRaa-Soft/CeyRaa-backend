import { Router } from 'express'
import clientPromise from '@/lib/mongodb'

const router = Router()

router.get('/', async (req, res) => {
  let isHealthy = false
  let errorMsg = ''
  const dbName = process.env.DATABASE_NAME || 'ceyraa'

  try {
    const client = await clientPromise
    await client.db(dbName).command({ ping: 1 })
    isHealthy = true
  } catch (error: any) {
    errorMsg = error.message || String(error)
  }

  // Check if browser is requesting HTML
  const acceptHeader = req.headers.accept || ''
  const isHtmlRequest = acceptHeader.includes('text/html')

  if (isHtmlRequest) {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>System Health Check</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <div class="flex items-center justify-between mb-6">
            <h1 class="text-xl font-bold tracking-tight">System Health Check</h1>
            <span class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              isHealthy
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }">
              ${isHealthy ? 'Healthy' : 'Error'}
            </span>
          </div>

          <div class="space-y-4">
            <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <span class="text-sm text-slate-400">Database Connection</span>
              <span class="font-medium ${isHealthy ? 'text-emerald-400' : 'text-rose-400'}">
                ${isHealthy ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <span class="text-sm text-slate-400">Database Name</span>
              <span class="font-mono text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-300">
                ${dbName}
              </span>
            </div>

            ${
              !isHealthy
                ? `
              <div class="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl space-y-1">
                <span class="text-xs font-semibold text-rose-400 uppercase tracking-wider text-rose-400">Error Details</span>
                <p class="text-xs font-mono text-rose-300/90 whitespace-pre-wrap overflow-x-auto leading-relaxed mt-1">
                  ${errorMsg}
                </p>
              </div>
            `
                : ''
            }

            <div class="text-[10px] text-slate-500 text-center pt-2">
              Checked at: ${new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    res
      .status(isHealthy ? 200 : 500)
      .type('text/html')
      .send(html)
  } else {
    // Otherwise, return JSON
    res.status(isHealthy ? 200 : 500).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: isHealthy ? 'connected' : 'disconnected',
      databaseName: dbName,
      error: isHealthy ? null : errorMsg,
      timestamp: new Date().toISOString()
    })
  }
})

export default router
