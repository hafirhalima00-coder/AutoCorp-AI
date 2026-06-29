import { execSync } from 'child_process'
import path from 'path'

const dataDir = path.join(process.cwd(), 'data', 'test')
process.env.DB_PATH = path.join(dataDir, 'autocorp.test.db')

beforeAll(() => {
  const fs = require('fs')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
})

afterAll(() => {
  const fs = require('fs')
  try {
    fs.rmSync(dataDir, { recursive: true, force: true })
  } catch { /* ignore */ }
})
