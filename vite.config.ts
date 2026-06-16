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

              // Use async spawn (not spawnSync) — spawnSync blocks the event loop and
              // causes ETIMEDOUT when the prompt is large or Claude CLI takes > 120s
              let stdout = '', stderr = ''
              const child = spawn(claudeBin, ['-p', prompt], {
                cwd: process.cwd(),
                env: { ...process.env },
              })

              child.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
              child.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

              // Hard timeout: kill after 3 minutes
              const timer = setTimeout(() => {
                child.kill('SIGTERM')
                if (!res.headersSent) {
                  res.statusCode = 504
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: 'Claude CLI timeout after 3 minutes' }))
                }
              }, 180_000)

              child.on('close', (code: number | null) => {
                clearTimeout(timer)
                if (res.headersSent) return
                if (code !== 0) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: stderr.trim() || `Exit code ${code}` }))
                  return
                }
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ text: stdout.trim() }))
              })

              child.on('error', (err: Error) => {
                clearTimeout(timer)
                if (!res.headersSent) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: String(err) }))
                }
              })
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

              // Spawn TC generator immediately (detached, non-blocking)
              const tcGenPath = join(process.cwd(), 'scripts', 'hermes-tc-gen.mjs')
              const tcChild = spawn(process.execPath, [tcGenPath, id], {
                detached: true,
                stdio: 'ignore',
                env: { ...process.env },
              })
              tcChild.unref()

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

        // POST /api/run-research — spawn auto-researcher for a platform (local only)
        server.middlewares.use('/api/run-research', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', () => {
            try {
              const { platform, apiKey } = JSON.parse(body) as { platform: string; apiKey?: string }
              if (!['super-admin', 'agency-admin', 'shop', 'all'].includes(platform)) {
                res.statusCode = 400; res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: `Invalid platform: ${platform}` })); return
              }
              const id = `research-${platform}-${Date.now()}`
              const statusDir = join(homedir(), '.claude', 'research-status')
              mkdirSync(statusDir, { recursive: true })
              writeFileSync(join(statusDir, `${id}.json`), JSON.stringify({
                id, platform, status: 'running', startedAt: new Date().toISOString(),
              }))
              const researcherPath = join(process.cwd(), 'scripts', 'auto-researcher.mjs')
              const resArgs = [researcherPath, platform, '--status-id', id]
              if (apiKey) resArgs.push('--api-key', apiKey)
              const child = spawn(process.execPath, resArgs, {
                detached: true, stdio: 'ignore', env: { ...process.env }, cwd: process.cwd(),
              })
              child.unref()
              res.statusCode = 200; res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ id }))
            } catch (err) {
              res.statusCode = 500; res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
        })

        // GET /api/knowledge-stats — knowledge base statistics (local only)
        server.middlewares.use('/api/knowledge-stats', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'GET') { res.statusCode = 405; res.end(); return }
          try {
            const knowledgeDir = join(process.cwd(), 'knowledge')
            const indexPath = join(knowledgeDir, 'index.json')
            if (!existsSync(indexPath)) {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ status: 'not-initialized', totalElements: 0, totalMappings: 0, pendingReresearch: [] }))
              return
            }
            const index = JSON.parse(readFileSync(indexPath, 'utf-8'))
            const logPath = join(knowledgeDir, 'learning-log.json')
            const log = existsSync(logPath) ? JSON.parse(readFileSync(logPath, 'utf-8')) : []
            const recentKbHits = (log as any[]).filter(e => e.result === 'pass' && e.strategy === 'knowledge-base').length
            const recentFails = (log as any[]).filter(e => e.result === 'fail').length
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              ...index.stats, lastResearched: index.lastResearched,
              recentKbHits, recentFails,
              pendingReresearch: index.stats?.pendingReresearch || [],
            }))
          } catch (err) {
            res.statusCode = 500; res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(err) }))
          }
        })

        // GET /api/research-status/:id — check research job status (local only)
        server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const m = req.url?.match(/^\/api\/research-status\/(.+)$/)
          if (!m) { next(); return }
          const id = m[1]
          const statusPath = join(homedir(), '.claude', 'research-status', `${id}.json`)
          res.setHeader('Content-Type', 'application/json')
          if (existsSync(statusPath)) {
            res.end(readFileSync(statusPath, 'utf-8'))
          } else {
            res.statusCode = 404; res.end(JSON.stringify({ error: 'Research job not found' }))
          }
        })

        // GET /api/learning-log?limit=N — read N newest entries from knowledge/learning-log.json
        server.middlewares.use('/api/learning-log', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'GET') { res.statusCode = 405; res.end(); return }
          try {
            const limitParam = new URL(req.url || '', 'http://x').searchParams.get('limit')
            const limit = Math.min(parseInt(limitParam || '50', 10), 1000)
            const logPath = join(process.cwd(), 'knowledge', 'learning-log.json')
            if (!existsSync(logPath)) {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ entries: [], total: 0 }))
              return
            }
            const all = JSON.parse(readFileSync(logPath, 'utf-8')) as unknown[]
            const entries = [...all].reverse().slice(0, limit)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ entries, total: all.length }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(err) }))
          }
        })

        // GET /api/hermes-stats — aggregated Hermes AI system metrics
        server.middlewares.use('/api/hermes-stats', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'GET') { res.statusCode = 405; res.end(); return }
          try {
            const knowledgeDir = join(process.cwd(), 'knowledge')
            const resultsDir   = join(homedir(), '.claude', 'test-results')

            const logPath    = join(knowledgeDir, 'learning-log.json')
            const learningLog: Record<string, unknown>[] = existsSync(logPath)
              ? JSON.parse(readFileSync(logPath, 'utf-8')) as Record<string, unknown>[]
              : []

            const synonymsPath = join(knowledgeDir, 'field-synonyms.json')
            const synonymsData = existsSync(synonymsPath)
              ? JSON.parse(readFileSync(synonymsPath, 'utf-8')) as { entries?: Record<string, unknown> }
              : { entries: {} }

            const indexPath = join(knowledgeDir, 'index.json')
            const kbIndex = existsSync(indexPath)
              ? JSON.parse(readFileSync(indexPath, 'utf-8')) as Record<string, unknown>
              : {}

            // Aggregate strategy breakdown
            const strategyMap: Record<string, { count: number; passCount: number }> = {}
            for (const entry of learningLog) {
              const s = String(entry.strategy || 'unknown')
              if (!strategyMap[s]) strategyMap[s] = { count: 0, passCount: 0 }
              strategyMap[s].count++
              if (entry.result === 'pass') strategyMap[s].passCount++
            }
            const strategyBreakdown = Object.entries(strategyMap).map(([strategy, data]) => ({ strategy, ...data }))

            // Read recent test results
            const recentTests: unknown[] = []
            let totalTests = 0, passCount = 0, failCount = 0
            if (existsSync(resultsDir)) {
              const files = readdirSync(resultsDir)
                .filter((f: string) => f.endsWith('.json'))
                .sort()
                .reverse()
                .slice(0, 20)
              for (const file of files) {
                try {
                  const r = JSON.parse(readFileSync(join(resultsDir, file), 'utf-8')) as Record<string, unknown>
                  totalTests++
                  const status = String(r.status || (r.passed ? 'pass' : 'fail'))
                  if (status === 'pass' || status === 'passed') passCount++; else failCount++
                  const steps = Array.isArray(r.steps) ? r.steps as Record<string, unknown>[] : []
                  recentTests.push({
                    id: r.id || file.replace('.json', ''),
                    status,
                    issueKey: r.issueKey,
                    tcId: r.tcId,
                    completedAt: r.completedAt || r.finishedAt,
                    stepCount: steps.length,
                    passSteps: steps.filter(s => s.result === 'pass').length,
                  })
                } catch {}
              }
            }

            // Only include entries with clean synonyms (no page-content garbage: no \n, length < 80)
            const synonymMappings = Object.entries(synonymsData.entries || {})
              .map(([key, entry]) => {
                const e = entry as Record<string, unknown>
                const rawSynonyms = Array.isArray(e.synonyms) ? e.synonyms as unknown[] : []
                const cleanSynonyms = rawSynonyms.filter(
                  (s): s is string => typeof s === 'string' && s.length < 80 && !s.includes('\n')
                )
                return { key, synonyms: cleanSynonyms, confidence: e.confidence || 0, source: e.source || 'manual', learnedAt: e.learnedAt || '', _hasGarbage: cleanSynonyms.length < rawSynonyms.length }
              })
              .filter(m => m.synonyms.length > 0)  // exclude entries where ALL synonyms were garbage

            // Check macOS LaunchAgent plist (no crontab — avoids macOS admin permission dialog)
            const plistPath    = join(homedir(), 'Library', 'LaunchAgents', 'com.ghn.hermes-learn.plist')
            const cronRegistered = existsSync(plistPath)
            let cronNext: string | null = null
            if (cronRegistered) {
              const next = new Date()
              next.setMinutes(0, 0, 0)
              next.setHours(next.getHours() + 1)
              cronNext = next.toISOString()
            }

            // index.json structure: { stats: { totalElements, totalMappings }, lastResearched: {...} }
            const kbIndexStats = (kbIndex.stats as Record<string, unknown>) || {}
            const kbStats = {
              totalElements: Number(kbIndexStats.totalElements ?? kbIndex.totalElements) || 0,
              totalMappings: synonymMappings.filter(m => !m._hasGarbage).length,  // count only clean entries
              totalMappingsRaw: synonymMappings.length,  // total including partially-clean entries
              lastResearched: (kbIndex.lastResearched as Record<string, string>) || {},
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              totalTests, passCount, failCount,
              strategyBreakdown,
              recentTests,
              learningLog: [...learningLog].reverse().slice(0, 30),
              synonymMappings,
              kbStats,
              cronNext,
              cronRegistered,
            }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(err) }))
          }
        })

        // POST /api/cron-register — write macOS LaunchAgent plist (no admin needed, avoids crontab permission dialog)
        // POST /api/cron-unregister — remove the plist file
        // macOS runs plist agents automatically every hour via launchd.
        // User must run `launchctl load ~/Library/LaunchAgents/com.ghn.hermes-learn.plist` once in Terminal to activate.
        const PLIST_LABEL  = 'com.ghn.hermes-learn'
        const PLIST_FILE   = join(homedir(), 'Library', 'LaunchAgents', `${PLIST_LABEL}.plist`)

        server.middlewares.use('/api/cron-register', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
          try {
            const nodeBin    = process.execPath
            const scriptPath = join(process.cwd(), 'scripts', 'hermes-learn.mjs')
            const logFile    = join(homedir(), '.claude', 'hermes-learn.log')

            // Ensure LaunchAgents directory exists (it always does on macOS, but just in case)
            mkdirSync(join(homedir(), 'Library', 'LaunchAgents'), { recursive: true })

            // Write plist — runs every 3600 seconds (1 hour)
            const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodeBin}</string>
    <string>${scriptPath}</string>
  </array>
  <key>StartInterval</key>
  <integer>3600</integer>
  <key>RunAtLoad</key>
  <false/>
  <key>StandardOutPath</key>
  <string>${logFile}</string>
  <key>StandardErrorPath</key>
  <string>${logFile}</string>
</dict>
</plist>`

            writeFileSync(PLIST_FILE, plist)

            // Try to load immediately via launchctl (no admin, just user-level agent)
            const loadResult = spawnSync('launchctl', ['load', PLIST_FILE], { encoding: 'utf-8' })
            const loadedOk   = loadResult.status === 0

            const next = new Date()
            next.setMinutes(0, 0, 0)
            next.setHours(next.getHours() + 1)

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              ok: true,
              plistPath: PLIST_FILE,
              loadedOk,
              // If launchctl load failed, user needs to run it manually once
              manualCmd: loadedOk ? null : `launchctl load "${PLIST_FILE}"`,
              nextRun: next.toISOString(),
            }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
        })

        server.middlewares.use('/api/cron-unregister', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
          try {
            if (existsSync(PLIST_FILE)) {
              spawnSync('launchctl', ['unload', PLIST_FILE], { encoding: 'utf-8' })
              unlinkSync(PLIST_FILE)
            }
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
        })

        // GET /api/learning-context — returns formatted learning context for TC generation prompt
        // Reads knowledge/field-synonyms.json + knowledge/learning-log.json + hardcoded PRECONDITION_PATHS
        // Used by JiraTaskPanel "Viết Test Case" to inject intelligence into the Claude prompt
        server.middlewares.use('/api/learning-context', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'GET') { res.statusCode = 405; res.end(); return }
          try {
            const knowledgeDir = join(process.cwd(), 'knowledge')

            // ── Field synonyms ──────────────────────────────────────────────────
            let synonymsData: { entries?: Record<string, { synonyms?: string[]; confidence?: number; source?: string }> } = { entries: {} }
            try { synonymsData = JSON.parse(readFileSync(join(knowledgeDir, 'field-synonyms.json'), 'utf-8')) } catch {}

            const fieldMappings: Array<{ key: string; synonyms: string[]; source?: string }> = []
            for (const [key, v] of Object.entries(synonymsData.entries || {})) {
              if (!v.synonyms || !Array.isArray(v.synonyms)) continue
              const validSynonyms = v.synonyms.filter((s: string) => typeof s === 'string' && s.length < 80 && !s.includes('\n'))
              if (validSynonyms.length > 0 && (v.source === 'learned' || ((v.confidence ?? 0) >= 0.9 && validSynonyms.length >= 2))) {
                fieldMappings.push({ key, synonyms: validSynonyms.slice(0, 3), source: v.source })
              }
            }

            // ── Learning log analysis ─────────────────────────────────────────
            let logEntries: Array<{ result?: string; stepText?: string; error?: string; strategy?: string }> = []
            try { logEntries = JSON.parse(readFileSync(join(knowledgeDir, 'learning-log.json'), 'utf-8')) } catch {}
            const recent = logEntries.slice(-200)

            const failedSteps = recent.filter(e => e.result === 'fail' && e.stepText && e.error)
            const failureGroups: Record<string, string[]> = {}
            for (const f of failedSteps) {
              const key = (f.error || '').slice(0, 60)
              if (!failureGroups[key]) failureGroups[key] = []
              if (failureGroups[key].length < 2) failureGroups[key].push(f.stepText || '')
            }

            const strategyCount: Record<string, number> = {}
            for (const e of recent.filter(e => e.result === 'pass')) {
              const s = e.strategy || 'unknown'
              strategyCount[s] = (strategyCount[s] || 0) + 1
            }

            const totalPass = recent.filter(e => e.result === 'pass').length
            const totalFail = recent.filter(e => e.result === 'fail').length

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              fieldMappings: fieldMappings.slice(0, 30),
              failureGroups,
              strategyCount,
              totalPass,
              totalFail,
              recentCount: recent.length,
            }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(err) }))
          }
        })

        // POST /api/hermes-chat — multi-turn chat with Hermes QA assistant
        // Body: { messages: [{role: 'user'|'assistant', content: string}] }
        // Builds conversation prompt from history, calls Claude CLI, returns { text }
        server.middlewares.use('/api/hermes-chat', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', () => {
            try {
              const { messages } = JSON.parse(body) as {
                messages: Array<{ role: 'user' | 'assistant'; content: string }>
              }
              if (!Array.isArray(messages) || messages.length === 0) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'messages array required' }))
                return
              }

              // ── System context about GHN Agency test runner ──────────────
              const systemCtx = `Bạn là Hermes, QA assistant cho nền tảng GHN Agency (web app React/TypeScript).
Nhiệm vụ: giúp tester xác định đúng tên element, step text, debug test cases.
GHN Agency có 3 platforms: Super Admin (/super-admin), Agency Admin (/agency-admin), Web Shop (/shop).
UI đặc biệt — Địa điểm khả dụng dùng search-box + checkbox tree (KHÔNG phải dropdown):
  Đúng sequence: Kéo xuống section Địa điểm khả dụng → Tại mục X, chọn "Tùy chỉnh" → Nhấn nút "Tuỳ chỉnh khu vực" → Nhập tìm kiếm khu vực: "Hà Nội" → Tick chọn "Hà Nội (30/30)" → Nhấn nút "Áp dụng"
  ❌ SAI: Chọn tỉnh/thành "Hà Nội" (không có element nào như vậy)
Step format đúng để test runner hiểu:
  fill:      Nhập [Field]: "[value]"       → Nhập Tên dịch vụ: "GHN Express"
  click:     Nhấn nút "[text]"             → Nhấn nút "Lưu"
  click:     Chọn "[option]"               → Chọn "Hàng nhẹ"
  ctx-click: Tại mục [section], chọn "[opt]" → Tại mục Địa điểm lấy hàng, chọn "Tùy chỉnh"
  search:    Nhập tìm kiếm [context]: "[value]"
  scroll:    Kéo xuống section [tên]
  precond:   Đang ở form tạo mới dịch vụ | Đang ở trang quản lý shop | v.v.
Trả lời ngắn gọn bằng tiếng Việt. Nếu biết element text chính xác → nêu rõ.`

              // ── Handle image attachments — write to temp file ────────────
              // Messages may contain imageDataUrl (base64 data URL from browser)
              // Write to /tmp, tell Claude to Read the file (Claude Code Read tool handles images)
              const imgTempFiles: string[] = []
              const messagesWithImgPaths = messages.map(m => {
                const msg = m as { role: string; content: string; imageDataUrl?: string }
                if (!msg.imageDataUrl) return { role: msg.role, content: msg.content }
                try {
                  const base64 = msg.imageDataUrl.replace(/^data:image\/\w+;base64,/, '')
                  const imgPath = `/tmp/hermes-chat-img-${Date.now()}-${Math.random().toString(36).slice(2)}.png`
                  writeFileSync(imgPath, Buffer.from(base64, 'base64'))
                  imgTempFiles.push(imgPath)
                  // Schedule cleanup after 10 min
                  setTimeout(() => { try { unlinkSync(imgPath) } catch {} }, 10 * 60 * 1000)
                  return {
                    role: msg.role,
                    content: msg.content,
                    _imagePath: imgPath,
                  }
                } catch { return { role: msg.role, content: msg.content } }
              })

              // ── Format conversation history ──────────────────────────────
              const history = messagesWithImgPaths
                .slice(0, -1)
                .map(m => {
                  const mm = m as { role: string; content: string; _imagePath?: string }
                  const imageNote = mm._imagePath
                    ? `\n[ĐÃ ĐÍNH KÈM ẢNH: ${mm._imagePath}]`
                    : ''
                  return `${mm.role === 'user' ? 'Tester' : 'Hermes'}: ${mm.content}${imageNote}`
                })
                .join('\n\n')
              const lastMsg = messagesWithImgPaths[messagesWithImgPaths.length - 1] as {
                role: string; content: string; _imagePath?: string
              }

              // If last message has an image, ask Claude to read it first
              const imageInstruction = lastMsg._imagePath
                ? `\n\n[YÊU CẦU: Tester đã gửi ảnh màn hình. Hãy đọc file ảnh tại đường dẫn: ${lastMsg._imagePath}\nSau khi đọc xong, trả lời câu hỏi của tester dựa trên nội dung ảnh.]`
                : ''

              const lastContent = lastMsg.content || '(Tester đính kèm ảnh không có câu hỏi — hãy đọc ảnh và mô tả những gì bạn thấy, đặc biệt là các UI element liên quan đến test automation)'

              const fullPrompt = history
                ? `${systemCtx}\n\n--- Lịch sử chat ---\n${history}\n\n--- Câu hỏi mới ---\nTester: ${lastContent}${imageInstruction}\n\nHermes:`
                : `${systemCtx}\n\nTester: ${lastContent}${imageInstruction}\n\nHermes:`

              // ── Spawn Claude CLI (async, non-blocking) ───────────────────
              const claudeBin = findClaudeBinary()
              let stdout = '', stderr = ''
              const child = spawn(claudeBin, ['-p', fullPrompt], {
                cwd: process.cwd(),
                env: { ...process.env },
              })
              child.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
              child.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

              const timer = setTimeout(() => {
                child.kill('SIGTERM')
                if (!res.headersSent) {
                  res.statusCode = 504
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: 'Hermes timeout (120s) — thử lại với câu ngắn hơn' }))
                }
              }, 120_000)

              child.on('close', (code: number | null) => {
                clearTimeout(timer)
                if (res.headersSent) return
                if (code !== 0) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: stderr.trim() || `Claude exit ${code}` }))
                  return
                }
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ text: stdout.trim() }))
              })

              child.on('error', (err: Error) => {
                clearTimeout(timer)
                if (!res.headersSent) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: String(err) }))
                }
              })
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
        })

        // POST /api/hermes-chat-learn — extract UI patterns from chat, update KB files
        // Body: { messages: [{role, content}] }
        // Runs in background — response returned immediately, Claude call is async
        server.middlewares.use('/api/hermes-chat-learn', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', () => {
            try {
              const { messages } = JSON.parse(body) as {
                messages: Array<{ role: 'user' | 'assistant'; content: string }>
              }
              if (!Array.isArray(messages) || messages.length < 2) {
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ ok: true, learned: 0, skipped: 'too few messages' }))
                return
              }

              // Respond immediately — learning happens in background
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, status: 'learning in background' }))

              // ── Build learning prompt ────────────────────────────────────
              const chatText = messages
                .map(m => `${m.role === 'user' ? 'Tester' : 'Hermes'}: ${m.content}`)
                .join('\n\n')

              const learnPrompt = `Từ cuộc trò chuyện QA test bên dưới, trích xuất các ánh xạ UI hữu ích cho test automation của GHN Agency web app.
Chỉ trích xuất những gì CHẮC CHẮN là đúng dựa trên nội dung chat. Không đoán.

Cuộc trò chuyện:
${chatText}

Trả về JSON (và CHỈ JSON, không text thêm):
{
  "fieldSynonyms": [
    { "key": "thuật ngữ test case (lowercase tiếng Việt)", "synonyms": ["text UI thực tế"], "confidence": 0.9 }
  ],
  "uiMappings": [
    { "key": "business term (lowercase)", "text": "UI text để click", "confidence": 0.9 }
  ]
}
Rules:
- confidence >= 0.85 mới được include
- REJECT nếu synonym trông như data value, ID, page content
- REJECT nếu intent và synonym không liên quan về nghĩa
- Nếu không có gì để học: {"fieldSynonyms":[],"uiMappings":[]}`

              // ── Run Claude in background ─────────────────────────────────
              try {
                const claudeBin = findClaudeBinary()
                let learnOut = ''
                const learnChild = spawn(claudeBin, ['-p', learnPrompt], {
                  cwd: process.cwd(),
                  env: { ...process.env },
                })
                learnChild.stdout?.on('data', (chunk: Buffer) => { learnOut += chunk.toString() })

                const learnTimer = setTimeout(() => { learnChild.kill('SIGTERM') }, 90_000)

                learnChild.on('close', (code: number | null) => {
                  clearTimeout(learnTimer)
                  if (code !== 0) return

                  try {
                    // Extract JSON from response (may be wrapped in markdown code block)
                    const jsonMatch = learnOut.match(/\{[\s\S]*\}/)
                    if (!jsonMatch) return
                    const parsed = JSON.parse(jsonMatch[0]) as {
                      fieldSynonyms?: Array<{ key: string; synonyms: string[]; confidence: number }>
                      uiMappings?: Array<{ key: string; text: string; confidence: number }>
                    }

                    const MIN_CONFIDENCE = 0.85
                    const knowledgeDir = join(process.cwd(), 'knowledge')

                    // ── Merge fieldSynonyms ──────────────────────────────
                    if (Array.isArray(parsed.fieldSynonyms) && parsed.fieldSynonyms.length > 0) {
                      const synPath = join(knowledgeDir, 'field-synonyms.json')
                      const synData = existsSync(synPath)
                        ? JSON.parse(readFileSync(synPath, 'utf-8')) as { version?: string; updatedAt?: string; entries?: Record<string, unknown> }
                        : { version: '1.1', updatedAt: '', entries: {} }
                      if (!synData.entries) synData.entries = {}

                      for (const s of parsed.fieldSynonyms) {
                        if (!s.key || !Array.isArray(s.synonyms) || (s.confidence ?? 0) < MIN_CONFIDENCE) continue
                        const k = s.key.toLowerCase().trim()
                        const cleanSyns = s.synonyms.filter((v: string) => typeof v === 'string' && v.length < 80 && !v.includes('\n'))
                        if (cleanSyns.length === 0) continue
                        const existing = synData.entries[k] as { synonyms?: string[]; confidence?: number; source?: string; learnedAt?: string } | undefined
                        if (!existing) {
                          synData.entries[k] = { synonyms: cleanSyns, confidence: s.confidence, source: 'chat-learned', learnedAt: new Date().toISOString().slice(0, 10) }
                        } else {
                          const merged = [...new Set([...(existing.synonyms || []), ...cleanSyns])]
                          existing.synonyms = merged
                          existing.learnedAt = new Date().toISOString().slice(0, 10)
                        }
                      }

                      synData.updatedAt = new Date().toISOString()
                      writeFileSync(synPath, JSON.stringify(synData, null, 2))
                    }

                    // ── Merge uiMappings (business-to-ui.json) ───────────
                    if (Array.isArray(parsed.uiMappings) && parsed.uiMappings.length > 0) {
                      const buiPath = join(knowledgeDir, 'business-to-ui.json')
                      const buiData = existsSync(buiPath)
                        ? JSON.parse(readFileSync(buiPath, 'utf-8')) as { version?: string; updatedAt?: string; entries?: Record<string, unknown> }
                        : { version: '1.0', updatedAt: '', entries: {} }
                      if (!buiData.entries) buiData.entries = {}

                      for (const m of parsed.uiMappings) {
                        if (!m.key || !m.text || (m.confidence ?? 0) < MIN_CONFIDENCE) continue
                        if (m.text.length > 80 || m.text.includes('\n')) continue
                        const k = m.key.toLowerCase().trim()
                        buiData.entries[k] = { text: m.text, confidence: m.confidence, source: 'chat-learned', learnedAt: new Date().toISOString().slice(0, 10) }
                      }

                      buiData.updatedAt = new Date().toISOString()
                      writeFileSync(buiPath, JSON.stringify(buiData, null, 2))
                    }
                  } catch {
                    // Silent — best-effort learning, never crash server
                  }
                })
              } catch {
                // findClaudeBinary failed or spawn error — silent, already responded 200
              }
            } catch (err) {
              if (!res.headersSent) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: String(err) }))
              }
            }
          })
        })

        // POST /api/log-bug — create Jira Bug from Telegram bot
        // Body: { storyKey, description, env?, reporter? }
        // storyKey can be issue key ("AGENCY-171") or full Jira URL
        // Inherits assignee, QC, sprint, fixVersions from the linked story
        server.middlewares.use('/api/log-bug', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            res.statusCode = 204; res.end(); return
          }
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', async () => {
            try {
              // Credentials via headers (same pattern as /api/jira proxy)
              // Bot passes X-Jira-Base-URL and X-Jira-Auth (same values as browser localStorage)
              const jiraBase = (req.headers['x-jira-base-url'] as string || '').replace(/\/$/, '')
              const jiraAuthHeader = req.headers['x-jira-auth'] as string || ''
              const projectKey = req.headers['x-jira-project-key'] as string || 'AGENCY'
              const qcFieldId = req.headers['x-jira-qc-field'] as string || 'customfield_10034'

              if (!jiraBase || !jiraAuthHeader) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Missing X-Jira-Base-URL or X-Jira-Auth headers' }))
                return
              }
              const jiraHeaders: Record<string, string> = {
                'Authorization': jiraAuthHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              }

              const payload = JSON.parse(body) as {
                storyKey?: string   // "AGENCY-171" or full Jira browse URL
                description: string
                env?: string        // "BETA" | "PILOT", inferred from story if omitted
                reporter?: string   // Telegram username
              }

              // Extract issue key from URL if needed
              let storyKey = (payload.storyKey || '').trim()
              const urlMatch = storyKey.match(/\/browse\/([A-Z]+-\d+)/)
              if (urlMatch) storyKey = urlMatch[1]

              if (!storyKey || !payload.description) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'storyKey and description are required' }))
                return
              }

              // Fetch story to inherit fields
              const fields = `summary,assignee,fixVersions,priority,customfield_10020,${qcFieldId}`
              const storyRes = await fetch(
                `${jiraBase}/rest/api/3/issue/${storyKey}?fields=${fields}`,
                { headers: jiraHeaders }
              )
              if (!storyRes.ok) {
                res.statusCode = 400; res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: `Story ${storyKey} not found: ${storyRes.status}` }))
                return
              }
              const story = await storyRes.json() as {
                fields: Record<string, unknown> & {
                  summary: string
                  assignee?: { accountId: string; displayName: string }
                  fixVersions?: Array<{ id: string; name: string }>
                  priority?: { name: string }
                  customfield_10020?: { id: number; name: string } | Array<{ id: number; name: string }>
                }
              }

              // Parse "[PLATFORM - UAT - ENV] Feature Title: ..." from story summary
              const storySummary = story.fields.summary || ''
              const prefixMatch = storySummary.match(/^\[([^\]]+)\]\s*([^:]+):/)
              const storyPrefix = prefixMatch ? prefixMatch[1] : '' // "APP SHOP - UAT - PILOT"
              const featureTitle = prefixMatch ? prefixMatch[2].trim() : ''
              const platformName = storyPrefix.split(' - ')[0]?.trim() || projectKey
              const env = payload.env || (storyPrefix.includes('PILOT') ? 'PILOT' : 'BETA')

              const bugTitle = `[${platformName} - UAT - ${env}] ${featureTitle ? featureTitle + ': ' : ''}${payload.description}`

              // Resolve sprint ID from story (customfield_10020)
              let sprintId: number | undefined
              const sprintRaw = story.fields.customfield_10020
              if (Array.isArray(sprintRaw) && sprintRaw.length > 0) {
                sprintId = (sprintRaw[sprintRaw.length - 1] as { id: number }).id
              } else if (sprintRaw && typeof sprintRaw === 'object' && 'id' in (sprintRaw as object)) {
                sprintId = (sprintRaw as { id: number }).id
              }

              // QC field value from story
              const qcValue = story.fields[qcFieldId] as { accountId: string } | undefined

              // Build create-issue payload
              const createPayload: Record<string, unknown> = {
                fields: {
                  project: { key: projectKey },
                  summary: bugTitle,
                  issuetype: { name: 'Bug' },
                  description: {
                    type: 'doc', version: 1,
                    content: [
                      { type: 'paragraph', content: [{ type: 'text', text: payload.description }] },
                      ...(payload.reporter
                        ? [{ type: 'paragraph', content: [{ type: 'text', text: `Báo cáo bởi: ${payload.reporter}` }] }]
                        : []),
                    ],
                  },
                  ...(story.fields.assignee ? { assignee: { accountId: story.fields.assignee.accountId } } : {}),
                  ...(story.fields.fixVersions?.length ? { fixVersions: story.fields.fixVersions.map((v) => ({ id: v.id })) } : {}),
                  ...(story.fields.priority ? { priority: { name: story.fields.priority.name } } : {}),
                  ...(qcValue?.accountId ? { [qcFieldId]: { accountId: qcValue.accountId } } : {}),
                },
              }

              const createRes = await fetch(`${jiraBase}/rest/api/3/issue`, {
                method: 'POST', headers: jiraHeaders, body: JSON.stringify(createPayload),
              })
              if (!createRes.ok) {
                const errText = await createRes.text()
                res.statusCode = 500; res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: `Create bug failed (${createRes.status}): ${errText}` }))
                return
              }
              const created = await createRes.json() as { key: string }
              const bugKey = created.key
              const bugUrl = `${jiraBase}/browse/${bugKey}`

              // Add bug to sprint (non-fatal)
              if (sprintId) {
                await fetch(`${jiraBase}/rest/agile/1.0/sprint/${sprintId}/issue`, {
                  method: 'POST', headers: jiraHeaders,
                  body: JSON.stringify({ issues: [bugKey] }),
                }).catch(() => {})
              }

              // Link: bug blocks story (non-fatal)
              await fetch(`${jiraBase}/rest/api/2/issueLink`, {
                method: 'POST', headers: jiraHeaders,
                body: JSON.stringify({
                  type: { name: 'Blocks' },
                  inwardIssue: { key: bugKey },
                  outwardIssue: { key: storyKey },
                }),
              }).catch(() => {})

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.end(JSON.stringify({
                ok: true,
                issueKey: bugKey,
                issueUrl: bugUrl,
                title: bugTitle,
                inherited: {
                  assignee: story.fields.assignee?.displayName || null,
                  sprint: sprintId || null,
                  fixVersions: story.fields.fixVersions?.map((v) => v.name) || [],
                  qc: qcValue?.accountId ? 'copied' : null,
                },
              }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
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
    port: 2000,
  },
})
