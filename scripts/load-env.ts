// Minimal .env.local / .env reader for the command-line scripts (Next.js loads these itself for the site).
import { existsSync, readFileSync } from 'node:fs'

export function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i.exec(line)
      if (!m || line.trim().startsWith('#')) continue
      const value = m[2]!.replace(/^(['"])(.*)\1$/, '$2')
      if (process.env[m[1]!] === undefined) process.env[m[1]!] = value
    }
  }
}
