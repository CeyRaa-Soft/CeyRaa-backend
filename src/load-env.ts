import dotenv from 'dotenv'
import * as path from 'path'

// Resolve the absolute path to .env relative to this file
dotenv.config({ path: path.join(__dirname, '../.env') })
