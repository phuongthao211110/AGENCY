import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { spawnSync, spawn } from 'node:child_process'
import { existsSync, readdirSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

function findClaudeBinary(): string {
  // 1. Try PATH via `which`
  const which = spawnSync('which', ['claude'], { encoding: 'utf-8' })
  if (which.status === 0 && which.stdout.trim()) return which.stdout.trim()

  const home = process.env.HOME || ''

  // 2. VS Code extension (find latest version)
  const extDir = join(home, '.vscode', 'extensions')
  if (existsSync(extDir)) {
    const dirs = readdirSync(extDir).filter((d) => d.startsWith('anthropic.claude-code'))
    for (const d of dirs.sort().reverse()) {
      const p = join(extDir, d, 'resources', 'native-binary', 'claude')
      if (existsSync(p)) return p
    }
  }

  // 3. Claude desktop app VM path
  const vmBase = join(home, 'Library', 'Application Support', 'Claude', 'claude-code-vm')
  if (existsSync(vmBase)) {
    const versions = readdirSync(vmBase).sort().reverse()
    for (const v of versions) {
      const p = join(vmBase, v, 'claude')
      if (existsSync(p)) return p
    }
  }

  // 4. npm global
  const npmGlobal = join(home, '.npm-global', 'bin', 'claude')
  if (existsSync(npmGlobal)) return npmGlobal

  throw new Error('Claude CLI binary không tìm thấy. Hãy cài đặt Claude Code (VS Code extension hoặc npm install -g @anthropic-ai/claude-code).')
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'jira-proxy',
      configureServer(server) {
        server.middlewares.use('/api/cowork', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end('Method Not Allowed')
            return
          }
          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', () => {
            try {
              const { prompt } = JSON.parse(body) as { prompt: string }

              const claudeBin = findClaudeBinary()
              const result = spawnSync(claudeBin, ['-p', prompt], {
                cwd: process.cwd(),
                timeout: 120000,
                encoding: 'utf-8',
                maxBuffer: 1024 * 1024 * 4,
              })

              if (result.error) throw result.error
              if (result.status !== 0) throw new Error(result.stderr || `Exit code ${result.status}`)

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ text: result.stdout.trim() }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
        })

        // POST /api/queue-test — write test request to ~/.claude/test-queue/
        server.middlewares.use('/api/queue-test', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', () => {
            try {
              const payload = JSON.parse(body) as { testCase: unknown; env: unknown; issueKey: string; apiKey?: string }
              const id = `test-${Date.now()}`
              const queueDir = join(homedir(), '.claude', 'test-queue')
              mkdirSync(queueDir, { recursive: true })
              writeFileSync(join(queueDir, `${id}.json`), JSON.stringify({
                id, status: 'queued', issueKey: payload.issueKey,
                testCase: payload.testCase, env: payload.env,
                apiKey: payload.apiKey,
                queuedAt: new Date().toISOString(),
              }))

              // Spawn Playwright runner immediately (detached, non-blocking)
              const runnerPath = join(process.cwd(), 'scripts', 'run-test.mjs')
              const child = spawn(process.execPath, [runnerPath, id], {
                detached: true,
                stdio: 'ignore',
                env: { ...process.env },
              })
              child.unref()

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ id }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
        })

        // POST /api/queue-tc-gen — queue a test case generation request
        server.middlewares.use('/api/queue-tc-gen', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', () => {
            try {
              const payload = JSON.parse(body) as { issue: unknown; userStoryText: string; issueKey: string }
              const id = `tc-gen-${Date.now()}`
              const queueDir = join(homedir(), '.claude', 'tc-gen-queue')
              mkdirSync(queueDir, { recursive: true })
              writeFileSync(join(queueDir, `${id}.json`), JSON.stringify({
                id, issueKey: payload.issueKey,
                issue: payload.issue, userStoryText: payload.userStoryText,
                requestedAt: new Date().toISOString(),
              }))
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ id }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
        })

        // GET /api/tc-gen-status/:id — read tc-gen result or queue status
        server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const m = req.url?.match(/^\/api\/tc-gen-status\/(.+)$/)
          if (!m) { next(); return }
          const id = m[1]
          const resultPath = join(homedir(), '.claude', 'tc-gen-results', `${id}.json`)
          const queuePath  = join(homedir(), '.claude', 'tc-gen-queue', `${id}.json`)
          res.setHeader('Content-Type', 'application/json')
          if (existsSync(resultPath)) {
            res.end(readFileSync(resultPath, 'utf-8'))
          } else if (existsSync(queuePath)) {
            res.end(JSON.stringify({ status: 'pending', text: null }))
          } else {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'Not found' }))
          }
        })

        // GET /api/test-queue-list — list all queued + completed tests
        server.middlewares.use('/api/test-queue-list', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'GET') { res.statusCode = 405; res.end(); return }
          const queueDir   = join(homedir(), '.claude', 'test-queue')
          const resultsDir = join(homedir(), '.claude', 'test-results')
          const items: unknown[] = []
          if (existsSync(queueDir)) {
            for (const f of readdirSync(queueDir).filter(f => f.endsWith('.json'))) {
              try {
                const raw = JSON.parse(readFileSync(join(queueDir, f), 'utf-8')) as Record<string, unknown>
                items.push({ ...raw, _location: 'queue' })
              } catch {}
            }
          }
          if (existsSync(resultsDir)) {
            for (const f of readdirSync(resultsDir).filter(f => f.endsWith('.json'))) {
              try {
                const raw = JSON.parse(readFileSync(join(resultsDir, f), 'utf-8')) as Record<string, unknown>
                items.push({ ...raw, _location: 'results' })
              } catch {}
            }
          }
          // Sort by queuedAt or completedAt desc
          items.sort((a, b) => {
            const ta = ((a as Record<string, string>).queuedAt || (a as Record<string, string>).completedAt || '')
            const tb = ((b as Record<string, string>).queuedAt || (b as Record<string, string>).completedAt || '')
            return tb.localeCompare(ta)
          })
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(items))
        })

        // DELETE /api/test-delete/:id — remove from queue or results
        server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const m = req.url?.match(/^\/api\/test-delete\/(.+)$/)
          if (!m || req.method !== 'DELETE') { next(); return }
          const id = m[1]
          const queuePath  = join(homedir(), '.claude', 'test-queue', `${id}.json`)
          const resultPath = join(homedir(), '.claude', 'test-results', `${id}.json`)
          res.setHeader('Content-Type', 'application/json')
          if (existsSync(queuePath)) { unlinkSync(queuePath); res.end(JSON.stringify({ ok: true })) }
          else if (existsSync(resultPath)) { unlinkSync(resultPath); res.end(JSON.stringify({ ok: true })) }
          else { res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' })) }
        })

        // GET /api/test-status/:id — read result or queue file
        server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const m = req.url?.match(/^\/api\/test-status\/(.+)$/)
          if (!m) { next(); return }
          const id = m[1]
          const resultPath = join(homedir(), '.claude', 'test-results', `${id}.json`)
          const queuePath  = join(homedir(), '.claude', 'test-queue', `${id}.json`)
          res.setHeader('Content-Type', 'application/json')
          if (existsSync(resultPath)) {
            res.end(readFileSync(resultPath, 'utf-8'))
          } else if (existsSync(queuePath)) {
            res.end(JSON.stringify({ status: 'queued', output: '⏳ Đang đợi Claude thực hiện test...' }))
          } else {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'Test not found' }))
          }
        })

        server.middlewares.use('/api/jira', (req: IncomingMessage, res: ServerResponse) => {
          const jiraBaseUrl = req.headers['x-jira-base-url'] as string
          const jiraAuth = req.headers['x-jira-auth'] as string

          if (!jiraBaseUrl) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing X-Jira-Base-URL header' }))
            return
          }

          const targetPath = (req.url || '/').replace(/^\/?/, '/')
          const targetUrl = `${jiraBaseUrl.replace(/\/$/, '')}${targetPath}`

          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', async () => {
            try {
              const fetchRes = await fetch(targetUrl, {
                method: req.method,
                headers: {
                  'Authorization': jiraAuth,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                body: ['GET', 'HEAD'].includes((req.method || 'GET').toUpperCase()) ? undefined : (body || undefined),
              })
              const data = await fetchRes.text()
              res.statusCode = fetchRes.status
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.end(data)
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
        })
      },
    },
  ],
  server: {
    port: 4000,
  },
})
