import { useState, useEffect, useRef } from 'react'
import {
  ReloadOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import type { JiraIssue } from '../../hooks/useJiraApi'
import { getIssueDetail, updateIssueDescription } from '../../hooks/useJiraApi'
import type { JiraConfig } from '../../hooks/useJiraConfig'
import { adfToHtml, adfToText, textToAdf } from '../../utils/adfConverter'
import { generateClaudePrompt, generateTestCasePrompt } from '../../utils/jiraStoryTemplate'
import { C_ACTION, C_BORDER, C_TEXT_PRIMARY, C_TEXT_SECONDARY } from '../../theme/tokens'

// ─── Draft history ────────────────────────────────────────────────────────────

type DraftVersion = { text: string; savedAt: number; source: 'ai' | 'manual' }

const DRAFTS_KEY = 'ghn-jira-drafts'
const TC_DRAFTS_KEY = 'ghn-jira-testcases'
const MAX_VERSIONS = 10

function loadVersions(storageKey: string, issueKey: string): DraftVersion[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const store = JSON.parse(raw) as Record<string, DraftVersion[]>
    return store[issueKey] || []
  } catch { return [] }
}

function saveVersion(storageKey: string, issueKey: string, text: string, source: 'ai' | 'manual') {
  if (!text.trim()) return
  try {
    const raw = localStorage.getItem(storageKey)
    const store: Record<string, DraftVersion[]> = raw ? JSON.parse(raw) : {}
    const versions = store[issueKey] || []
    if (versions[0]?.text === text) return
    store[issueKey] = [{ text, savedAt: Date.now(), source }, ...versions].slice(0, MAX_VERSIONS)
    localStorage.setItem(storageKey, JSON.stringify(store))
  } catch {}
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const d = new Date(ts)
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

// ─── AI call helper ───────────────────────────────────────────────────────────

async function callAI(prompt: string, claudeApiKey?: string): Promise<string> {
  // If API key is configured → use Anthropic API directly (faster, no CLI overhead)
  if (claudeApiKey) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) throw new Error(`Claude API lỗi ${res.status}`)
    const data = await res.json() as { content?: Array<{ text: string }> }
    return data.content?.[0]?.text || ''
  }

  // No API key → use Claude CLI via /api/cowork
  const res = await fetch('/api/cowork', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  const data = await res.json() as { text?: string; error?: string }
  if (data.text) return data.text
  throw new Error(data.error || 'Không có phản hồi từ Claude CLI')
}

// ─── Test environment types & helpers ────────────────────────────────────────

export type PlatformId = 'agency' | 'ghn' | 'web-shop' | 'app-shop'
export type TestEnv = { url?: string; username?: string; password?: string }
export type TestEnvStore = Partial<Record<PlatformId, TestEnv>>

export const TEST_ENVS_KEY = 'ghn-test-envs'

export const PLATFORM_META: Record<PlatformId, { label: string; defaultUrl: string; color: string; bg: string }> = {
  'agency':   { label: '[AGENCY]',   defaultUrl: 'http://localhost:4000/agency-admin/shops',   color: '#2563EB', bg: '#EFF6FF' },
  'ghn':      { label: '[GHN]',      defaultUrl: 'http://localhost:4000/super-admin/agencies', color: '#7C3AED', bg: '#F5F3FF' },
  'web-shop': { label: '[WEB SHOP]', defaultUrl: 'http://localhost:4000/shop/orders',           color: '#D97706', bg: '#FFFBEB' },
  'app-shop': { label: '[APP SHOP]', defaultUrl: 'https://app.ghn.vn',                         color: '#059669', bg: '#ECFDF5' },
}

export function loadTestEnvs(): TestEnvStore {
  try { return JSON.parse(localStorage.getItem(TEST_ENVS_KEY) || '{}') } catch { return {} }
}

export function saveTestEnvs(store: TestEnvStore) {
  localStorage.setItem(TEST_ENVS_KEY, JSON.stringify(store))
}

function detectPlatform(issue: JiraIssue): PlatformId {
  const s = (issue.fields.summary || '').toUpperCase()
  if (s.includes('[APP SHOP]') || s.includes('[APP]')) return 'app-shop'
  if (s.includes('[WEB SHOP]') || s.includes('[SHOP]')) return 'web-shop'
  if (s.includes('[GHN]') || s.includes('[GSA]')) return 'ghn'
  if (s.includes('[AGENCY]') || s.includes('[AGA]')) return 'agency'
  // fallback: issue key prefix
  const key = issue.key.toUpperCase()
  if (key.startsWith('SHOP-')) return 'web-shop'
  if (key.startsWith('GSA-')) return 'ghn'
  return 'agency'
}

type StepResult = { step: string; result: 'pass' | 'fail' | 'skip'; note?: string }
type TestRunResult = {
  status: 'queued' | 'running' | 'pass' | 'fail' | 'error'
  output: string
  steps?: StepResult[]
  tcId?: string
  issueKey?: string
  completedAt?: string
}

// ─── TC result cache (per issueKey+tcId, persisted to localStorage) ───────────
const TC_RESULTS_KEY = 'ghn-tc-run-results'
type TcResult = { status: 'pass' | 'fail' | 'error'; completedAt: string; testId: string }
type TcResultCache = Record<string, TcResult> // key: `${issueKey}-${tcId}`

function loadTcResults(): TcResultCache {
  try { return JSON.parse(localStorage.getItem(TC_RESULTS_KEY) || '{}') } catch { return {} }
}
function saveTcResult(issueKey: string, tcId: string, result: TcResult) {
  const cache = loadTcResults()
  cache[`${issueKey}-${tcId}`] = result
  localStorage.setItem(TC_RESULTS_KEY, JSON.stringify(cache))
}

// ─── Component ────────────────────────────────────────────────────────────────

type Tab = 'view' | 'edit' | 'testcase'

type Props = {
  issue: JiraIssue
  config: JiraConfig
}

export default function JiraTaskPanel({ issue: initialIssue, config }: Props) {
  const [issue, setIssue] = useState<JiraIssue>(initialIssue)
  const [tab, setTab] = useState<Tab>('view')

  // User story state
  const [editText, setEditText] = useState('')
  const [versions, setVersions] = useState<DraftVersion[]>(() => loadVersions(DRAFTS_KEY, initialIssue.key))
  const [showHistory, setShowHistory] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Test case state — auto-load latest version if exists
  const [tcVersions, setTcVersions] = useState<DraftVersion[]>(() => loadVersions(TC_DRAFTS_KEY, initialIssue.key))
  const [tcText, setTcText] = useState(() => loadVersions(TC_DRAFTS_KEY, initialIssue.key)[0]?.text ?? '')
  const [showTcHistory, setShowTcHistory] = useState(false)
  const [generatingTc, setGeneratingTc] = useState(false)

  // Test run state
  const [testEnvs, setTestEnvs] = useState<TestEnvStore>(() => loadTestEnvs())
  const [showTestEnvModal, setShowTestEnvModal] = useState(false)
  const [pendingTc, setPendingTc] = useState<ParsedTestCase | null>(null)
  const [pendingPlatform, setPendingPlatform] = useState<PlatformId>('agency')
  const [testRunResult, setTestRunResult] = useState<TestRunResult | null>(null)
  const [showTestRunModal, setShowTestRunModal] = useState(false)
  const [tcResults, setTcResults] = useState<TcResultCache>(() => loadTcResults())

  // Shared
  const [fetching, setFetching] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null)

  // Refs for auto-save on task switch
  const editTextRef = useRef(editText)
  const tcTextRef = useRef(tcText)
  const issueKeyRef = useRef(issue.key)
  useEffect(() => { editTextRef.current = editText }, [editText])
  useEffect(() => { tcTextRef.current = tcText }, [tcText])

  // Auto-save when switching away from a task
  useEffect(() => {
    issueKeyRef.current = issue.key
    return () => {
      saveVersion(DRAFTS_KEY, issueKeyRef.current, editTextRef.current, 'manual')
      saveVersion(TC_DRAFTS_KEY, issueKeyRef.current, tcTextRef.current, 'manual')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issue.key])

  // When issue changes from outside
  useEffect(() => {
    setIssue(initialIssue)
    setTab('view')
    setToast(null)
    setShowHistory(false)
    setShowTcHistory(false)
    setVersions(loadVersions(DRAFTS_KEY, initialIssue.key))
    const newTcVersions = loadVersions(TC_DRAFTS_KEY, initialIssue.key)
    setTcVersions(newTcVersions)
    setTcText(newTcVersions[0]?.text ?? '')
    loadDetail(initialIssue.key)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIssue.key])

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg })
    setTimeout(() => setToast(null), 4000)
  }

  async function loadDetail(key: string) {
    setFetching(true)
    try {
      const detail = await getIssueDetail(config, key)
      setIssue(detail)
      setEditText(adfToText(detail.fields.description))
    } catch (err) {
      showToast(false, `Không lấy được chi tiết: ${String(err)}`)
    } finally {
      setFetching(false)
    }
  }

  async function handleWriteStory() {
    setGenerating(true)
    setTab('edit')
    setEditText('')
    try {
      const text = await callAI(generateClaudePrompt(issue), config.claudeApiKey)
      setEditText(text)
      saveVersion(DRAFTS_KEY, issue.key, text, 'ai')
      setVersions(loadVersions(DRAFTS_KEY, issue.key))
    } catch (err) {
      showToast(false, `Lỗi AI: ${String(err)}`)
    } finally {
      setGenerating(false)
    }
  }

  async function handleWriteTestCase() {
    // Source of truth = Jira description (the pushed/final version)
    const jiraDescText = adfToText(issue.fields.description)?.trim() ?? ''

    // Require at least a meaningful description on Jira before generating TC
    if (jiraDescText.length < 50) {
      showToast(false, `${issue.key} chưa có User Story trên Jira. Hãy viết User Story ở tab "Chỉnh sửa" và nhấn "Đẩy lên Jira" trước.`)
      setTab('edit')
      return
    }

    setGeneratingTc(true)
    setTab('testcase')
    setTcText('')
    try {
      // Always use Jira description as the authoritative user story source
      const text = await callAI(generateTestCasePrompt(issue, jiraDescText), config.claudeApiKey)
      setTcText(text)
      saveVersion(TC_DRAFTS_KEY, issue.key, text, 'ai')
      setTcVersions(loadVersions(TC_DRAFTS_KEY, issue.key))
    } catch (err) {
      showToast(false, `Lỗi AI: ${String(err)}`)
    } finally {
      setGeneratingTc(false)
    }
  }

  async function handlePush() {
    setPushing(true)
    try {
      const adf = textToAdf(editText)
      await updateIssueDescription(config, issue.key, adf)
      showToast(true, `Đã cập nhật description của ${issue.key} thành công`)
      await loadDetail(issue.key)
      setTab('view')
    } catch (err) {
      showToast(false, `Push thất bại: ${String(err)}`)
    } finally {
      setPushing(false)
    }
  }

  function handleStartTest(tc: ParsedTestCase) {
    const platform = detectPlatform(issue)
    const env = testEnvs[platform]
    if (!env?.url) {
      setPendingTc(tc)
      setPendingPlatform(platform)
      setShowTestEnvModal(true)
      return
    }
    queueTest(tc, env, platform)
  }

  async function queueTest(tc: ParsedTestCase, env: TestEnv, platform: PlatformId) {
    setShowTestRunModal(true)
    setTestRunResult({ status: 'running', output: '🚀 Đang khởi động Playwright...' })
    try {
      const res = await fetch('/api/queue-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCase: tc, env, issueKey: issue.key, platform,
          apiKey: config.claudeApiKey || undefined,
        }),
      })
      const { id } = await res.json() as { id: string }
      setTestRunResult({ status: 'running', output: '🚀 Chrome đang mở — test đang chạy...' })
      startPolling(id)
    } catch (e) {
      setTestRunResult({ status: 'error', output: `Lỗi: ${String(e)}` })
    }
  }

  function startPolling(id: string) {
    const poll = async () => {
      try {
        const res = await fetch(`/api/test-status/${id}`)
        const data = await res.json() as TestRunResult
        setTestRunResult(data)
        if (data.status === 'queued' || data.status === 'running') {
          setTimeout(poll, 3000)
        } else {
          // Final result — persist to localStorage so cards show badge
          if (data.tcId && data.issueKey) {
            saveTcResult(data.issueKey, data.tcId, {
              status: data.status as TcResult['status'],
              completedAt: data.completedAt || new Date().toISOString(),
              testId: id,
            })
            setTcResults(loadTcResults())
          }
        }
      } catch {
        setTimeout(poll, 5000)
      }
    }
    setTimeout(poll, 3000)
  }

  function handleRestoreVersion(v: DraftVersion) {
    setEditText(v.text)
    setTab('edit')
    setShowHistory(false)
  }

  function handleRestoreTcVersion(v: DraftVersion) {
    setTcText(v.text)
    setTab('testcase')
    setShowTcHistory(false)
  }

  const statusName = issue.fields.status?.name || '—'
  const storyPoints = issue.fields.customfield_10016
  const assignee = issue.fields.assignee?.displayName || '—'
  const labels = issue.fields.labels || []
  const issueType = issue.fields.issuetype?.name || 'Task'
  const priority = issue.fields.priority?.name
  const descHtml = adfToHtml(issue.fields.description)

  // Active history panel to show (only one at a time)
  const activeHistory = showHistory ? 'story' : showTcHistory ? 'tc' : null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

      {/* Task header */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C_BORDER}`, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#3B82F6' }}>{issue.key}</span>
              <Chip text={issueType} bg="#EFF6FF" color="#1D4ED8" />
              <Chip text={statusName} bg={getStatusBg(statusName)} color={getStatusColor(statusName)} />
              {storyPoints && <Chip text={`${storyPoints} pts`} bg="#F3F4F6" color="#374151" />}
              {priority && <Chip text={priority} bg="#FFF7ED" color="#D97706" />}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: 1.4 }}>
              {issue.fields.summary}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C_TEXT_SECONDARY, flexWrap: 'wrap' }}>
          <span>👤 {assignee}</span>
          {labels.length > 0 && <span>🏷 {labels.join(', ')}</span>}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, alignItems: 'center',
        borderBottom: `1px solid ${C_BORDER}`,
        background: '#fff', padding: '0 20px',
        flexWrap: 'nowrap', overflowX: 'auto',
      }}>
        {/* Tabs */}
        <TabItem label="Xem" active={tab === 'view'} color={C_ACTION} onClick={() => setTab('view')} />
        <TabItem label="Chỉnh sửa" active={tab === 'edit'} color={C_ACTION} onClick={() => setTab('edit')} />
        <TabItem label="🧪 Test Case" active={tab === 'testcase'} color="#16A34A" onClick={() => setTab('testcase')} />

        <div style={{ flex: 1, minWidth: 8 }} />

        {/* History buttons */}
        {versions.length > 0 && (
          <HistoryBtn
            label={`US (${versions.length})`}
            active={showHistory}
            onClick={() => { setShowHistory(v => !v); setShowTcHistory(false) }}
          />
        )}
        {tcVersions.length > 0 && (
          <HistoryBtn
            label={`TC (${tcVersions.length})`}
            active={showTcHistory}
            color="#16A34A"
            onClick={() => { setShowTcHistory(v => !v); setShowHistory(false) }}
          />
        )}

        {/* Reload */}
        <button
          onClick={() => loadDetail(issue.key)}
          disabled={fetching}
          title="Lấy mới nhất từ Jira"
          style={{
            padding: '4px 10px', margin: '4px 0 4px 6px',
            border: `1px solid ${C_BORDER}`, borderRadius: 5,
            background: '#fff', cursor: fetching ? 'not-allowed' : 'pointer',
            fontSize: 12, color: C_TEXT_SECONDARY, display: 'flex', alignItems: 'center', gap: 4,
            flexShrink: 0,
          }}
        >
          <ReloadOutlined spin={fetching} style={{ fontSize: 11 }} />
          Lấy mới
        </button>
      </div>

      {/* History panel — User Story */}
      {activeHistory === 'story' && versions.length > 0 && (
        <HistoryPanel
          title={`LỊCH SỬ USER STORY — ${issue.key}`}
          versions={versions}
          bg="#FFFBF5"
          onRestore={handleRestoreVersion}
        />
      )}

      {/* History panel — Test Case */}
      {activeHistory === 'tc' && tcVersions.length > 0 && (
        <HistoryPanel
          title={`LỊCH SỬ TEST CASE — ${issue.key}`}
          versions={tcVersions}
          bg="#F0FDF4"
          onRestore={handleRestoreTcVersion}
        />
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {tab === 'view' && (
          fetching
            ? <div style={{ color: C_TEXT_SECONDARY, fontSize: 13 }}>Đang tải...</div>
            : descHtml
              ? <div dangerouslySetInnerHTML={{ __html: descHtml }} style={{ fontSize: 13, color: C_TEXT_PRIMARY, lineHeight: 1.7 }} />
              : <div style={{ color: C_TEXT_SECONDARY, fontSize: 13, fontStyle: 'italic' }}>Chưa có mô tả trong Jira task này.</div>
        )}

        {tab === 'edit' && (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Nội dung description / user story..."
            style={textareaStyle}
          />
        )}

        {tab === 'testcase' && (
          generatingTc
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, color: C_TEXT_SECONDARY, fontSize: 13 }}>
                <span style={{ fontSize: 16 }}>🧪</span> Đang tạo test case...
              </div>
            : tcText
              ? <TestCaseList text={tcText} onRun={handleStartTest} issueKey={issue.key} tcResults={tcResults} />
              : <div style={{ color: C_TEXT_SECONDARY, fontSize: 13, fontStyle: 'italic', paddingTop: 8 }}>
                  Chưa có test case. Bấm "🧪 Viết Test Case" để AI generate.
                </div>
        )}
      </div>

      {/* Action bar */}
      <div style={{
        padding: '10px 20px',
        borderTop: `1px solid ${C_BORDER}`,
        background: '#fff',
        display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
      }}>
        {tab !== 'testcase' && (
          <button
            onClick={handleWriteStory}
            disabled={generating}
            style={{
              padding: '7px 16px', borderRadius: 6,
              border: '1px solid #C7D2FE', background: '#EEF2FF',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 600,
              color: '#4338CA', display: 'flex', alignItems: 'center', gap: 5,
              opacity: generating ? 0.7 : 1,
            }}
          >
            ✨ {generating ? 'Đang viết...' : 'Viết User Story'}
          </button>
        )}

        {tab === 'testcase' && (
          <button
            onClick={handleWriteTestCase}
            disabled={generatingTc}
            style={{
              padding: '7px 16px', borderRadius: 6,
              border: '1px solid #BBF7D0', background: '#F0FDF4',
              cursor: generatingTc ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 600,
              color: '#16A34A', display: 'flex', alignItems: 'center', gap: 5,
              opacity: generatingTc ? 0.7 : 1,
            }}
          >
            🧪 {generatingTc ? 'Đang viết...' : 'Viết Test Case'}
          </button>
        )}

        <div style={{ flex: 1 }} />

        {/* Push to Jira — only for user story tab */}
        {tab === 'edit' && (
          <button
            onClick={handlePush}
            disabled={pushing || !editText.trim()}
            style={{
              padding: '7px 18px', borderRadius: 6,
              border: 'none',
              background: pushing || !editText.trim() ? '#E5E7EB' : C_ACTION,
              color: pushing || !editText.trim() ? C_TEXT_SECONDARY : '#fff',
              cursor: pushing || !editText.trim() ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <UploadOutlined />
            {pushing ? 'Đang đẩy...' : 'Đẩy lên Jira'}
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', bottom: 70, right: 16,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 8,
          background: toast.ok ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${toast.ok ? '#BBF7D0' : '#FECACA'}`,
          fontSize: 12, color: toast.ok ? '#166534' : '#991B1B',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: 360, zIndex: 10,
        }}>
          {toast.ok ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Test Env Modal (quick config for current platform) */}
      {showTestEnvModal && (
        <TestEnvModal
          platform={pendingPlatform}
          initial={testEnvs[pendingPlatform] || {}}
          onConfirm={(env) => {
            const updated = { ...testEnvs, [pendingPlatform]: env }
            setTestEnvs(updated)
            saveTestEnvs(updated)
            setShowTestEnvModal(false)
            if (pendingTc) { queueTest(pendingTc, env, pendingPlatform); setPendingTc(null) }
          }}
          onCancel={() => { setShowTestEnvModal(false); setPendingTc(null) }}
        />
      )}

      {/* Test Run Modal */}
      {showTestRunModal && testRunResult && (
        <TestRunModal
          result={testRunResult}
          tcTitle={pendingTc?.title || ''}
          onClose={() => setShowTestRunModal(false)}
        />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const textareaStyle: React.CSSProperties = {
  width: '100%', minHeight: 360,
  border: `1px solid #E5E7EB`, borderRadius: 6,
  padding: '10px 12px',
  fontSize: 12, lineHeight: 1.7,
  fontFamily: "'Courier New', Courier, monospace",
  color: '#111827',
  resize: 'vertical', outline: 'none',
  boxSizing: 'border-box',
}

function TabItem({ label, active, color, onClick }: {
  label: string; active: boolean; color: string; onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '8px 16px', fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? color : '#6B7280',
        borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
        cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  )
}

function HistoryBtn({ label, active, color = '#FF5200', onClick }: {
  label: string; active: boolean; color?: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px', margin: '4px 0',
        border: `1px solid ${active ? color : '#E5E7EB'}`,
        borderRadius: 5,
        background: active ? (color === '#16A34A' ? '#F0FDF4' : '#FFF4ED') : '#fff',
        cursor: 'pointer', fontSize: 12,
        color: active ? color : '#6B7280',
        display: 'flex', alignItems: 'center', gap: 4,
        flexShrink: 0,
      }}
    >
      <HistoryOutlined style={{ fontSize: 11 }} />
      {label}
    </button>
  )
}

function HistoryPanel({ title, versions, bg, onRestore }: {
  title: string
  versions: DraftVersion[]
  bg: string
  onRestore: (v: DraftVersion) => void
}) {
  return (
    <div style={{ borderBottom: `1px solid #E5E7EB`, background: bg, maxHeight: 220, overflow: 'auto' }}>
      <div style={{ padding: '8px 20px 4px', fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: 0.4 }}>
        {title}
      </div>
      {versions.map((v, i) => (
        <div
          key={v.savedAt}
          style={{
            padding: '8px 20px',
            borderTop: i > 0 ? `1px solid #E5E7EB` : undefined,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 3, fontWeight: 600,
                background: v.source === 'ai' ? '#EEF2FF' : '#F3F4F6',
                color: v.source === 'ai' ? '#4338CA' : '#6B7280',
              }}>
                {v.source === 'ai' ? '✨ AI' : '✏ Thủ công'}
              </span>
              <span style={{ fontSize: 11, color: '#6B7280' }}>{formatTimeAgo(v.savedAt)}</span>
            </div>
            <div style={{
              fontSize: 12, color: '#374151',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              fontFamily: 'monospace',
            }}>
              {v.text.slice(0, 120)}
            </div>
          </div>
          <button
            onClick={() => onRestore(v)}
            style={{
              flexShrink: 0, padding: '4px 10px', borderRadius: 5,
              border: `1px solid #E5E7EB`, background: '#fff',
              cursor: 'pointer', fontSize: 11, fontWeight: 600,
              color: '#FF5200', whiteSpace: 'nowrap',
            }}
          >
            Khôi phục
          </button>
        </div>
      ))}
    </div>
  )
}

function Chip({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: bg, color, fontWeight: 500 }}>
      {text}
    </span>
  )
}

function getStatusBg(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('done') || n.includes('closed')) return '#F0FDF4'
  if (n.includes('progress') || n.includes('review')) return '#EFF6FF'
  if (n.includes('blocked')) return '#FEF2F2'
  return '#F3F4F6'
}

function getStatusColor(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('done') || n.includes('closed')) return '#16A34A'
  if (n.includes('progress') || n.includes('review')) return '#3B82F6'
  if (n.includes('blocked')) return '#DC2626'
  return '#6B7280'
}

// ─── Test Case Card View ──────────────────────────────────────────────────────

type ParsedTestCase = {
  id: string
  title: string
  type: string
  precondition: string
  steps: string[]
  expected: string
}

function parseTestCases(text: string): ParsedTestCase[] {
  const blocks = text.split(/(?=### TC-\d+:)/g).filter(b => b.trim().startsWith('### TC-'))
  return blocks.map(block => {
    const titleMatch = block.match(/^### (TC-\d+):\s*(.+)$/m)
    const typeMatch  = block.match(/\*\*Loại:\*\*\s*(.+)/)
    const precMatch  = block.match(/\*\*Điều kiện tiên quyết:\*\*\s*(.+)/)
    const stepsMatch = block.match(/\*\*Bước thực hiện:\*\*([\s\S]*?)(?=\*\*Kết quả|$)/)
    const expMatch   = block.match(/\*\*Kết quả mong đợi:\*\*\s*([\s\S]*?)(?=---|###|$)/)

    const stepsText = stepsMatch?.[1] || ''
    const steps = stepsText.split('\n')
      .filter(l => /^\d+\./.test(l.trim()))
      .map(l => l.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean)

    return {
      id:           titleMatch?.[1]?.trim() || 'TC-?',
      title:        titleMatch?.[2]?.trim() || block.slice(0, 80),
      type:         typeMatch?.[1]?.trim() || '',
      precondition: precMatch?.[1]?.trim() || '',
      steps,
      expected:     expMatch?.[1]?.trim() || '',
    }
  })
}

const TC_TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  'main':        { bg: '#DBEAFE', color: '#1D4ED8' },
  'validation':  { bg: '#FEF3C7', color: '#D97706' },
  'exception':   { bg: '#FEE2E2', color: '#DC2626' },
  'edge':        { bg: '#F3E8FF', color: '#9333EA' },
  'permission':  { bg: '#F3F4F6', color: '#6B7280' },
}

function getTypeStyle(type: string) {
  const key = Object.keys(TC_TYPE_STYLE).find(k => type.toLowerCase().includes(k))
  return key ? TC_TYPE_STYLE[key] : { bg: '#F3F4F6', color: '#6B7280' }
}

function TestCaseList({
  text, onRun, issueKey, tcResults,
}: {
  text: string
  onRun: (tc: ParsedTestCase) => void
  issueKey: string
  tcResults: TcResultCache
}) {
  const cases = parseTestCases(text)
  if (cases.length === 0) {
    return (
      <pre style={{
        fontSize: 12, lineHeight: 1.7, color: '#111827',
        fontFamily: "'Courier New', Courier, monospace",
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
      }}>
        {text}
      </pre>
    )
  }
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12, fontWeight: 600 }}>
        {cases.length} TEST CASE
      </div>
      {cases.map(tc => (
        <TestCaseCard
          key={tc.id} tc={tc} onRun={onRun}
          result={tcResults[`${issueKey}-${tc.id}`]}
        />
      ))}
    </div>
  )
}

function TestCaseCard({
  tc, onRun, result,
}: {
  tc: ParsedTestCase
  onRun: (tc: ParsedTestCase) => void
  result?: TcResult
}) {
  const typeStyle = getTypeStyle(tc.type)

  // Border color based on result
  const borderColor = result
    ? result.status === 'pass' ? '#86EFAC' : result.status === 'fail' ? '#FCA5A5' : '#FDE68A'
    : '#E5E7EB'

  return (
    <div style={{
      border: `1px solid ${borderColor}`, borderRadius: 8,
      marginBottom: 12, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '9px 14px',
        background: result
          ? result.status === 'pass' ? '#F0FDF4' : result.status === 'fail' ? '#FFF1F2' : '#FFFBEB'
          : '#F9FAFB',
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: '#3B82F6', flexShrink: 0 }}>{tc.id}</span>
        {tc.type && (
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 600,
            background: typeStyle.bg, color: typeStyle.color, flexShrink: 0,
          }}>
            {tc.type}
          </span>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1 }}>{tc.title}</span>
        {/* Result badge in header */}
        {result && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 10, flexShrink: 0,
            background: result.status === 'pass' ? '#DCFCE7' : result.status === 'fail' ? '#FEE2E2' : '#FEF3C7',
            color: result.status === 'pass' ? '#16A34A' : result.status === 'fail' ? '#DC2626' : '#D97706',
            border: `1px solid ${result.status === 'pass' ? '#86EFAC' : result.status === 'fail' ? '#FCA5A5' : '#FDE68A'}`,
          }}>
            {result.status === 'pass' ? '✅ PASS' : result.status === 'fail' ? '❌ FAIL' : '⚠ Error'}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tc.precondition && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 3 }}>
              ĐIỀU KIỆN TIÊN QUYẾT
            </div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{tc.precondition}</div>
          </div>
        )}

        {tc.steps.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>
              BƯỚC THỰC HIỆN
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {tc.steps.map((step, i) => (
                <div key={i} style={{ fontSize: 12, color: '#111827', lineHeight: 1.6, display: 'flex', gap: 6 }}>
                  <span style={{ fontWeight: 600, color: '#6B7280', minWidth: 18 }}>{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tc.expected && (
          <div style={{
            padding: '9px 12px', background: '#F0FDF4',
            borderRadius: 6, border: '1px solid #BBF7D0',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#16A34A', marginBottom: 3 }}>
              ✓ KẾT QUẢ MONG ĐỢI
            </div>
            <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.5 }}>{tc.expected}</div>
          </div>
        )}
      </div>

      {/* Footer — result info + run button */}
      <div style={{
        padding: '8px 14px', borderTop: `1px solid ${borderColor}`,
        background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        {result ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#6B7280' }}>
              Đã test {formatTimeAgo(new Date(result.completedAt).getTime())}
            </span>
          </div>
        ) : <div />}
        <button
          onClick={() => onRun(tc)}
          style={{
            padding: '4px 14px',
            background: result ? '#F9FAFB' : '#EFF6FF',
            border: `1px solid ${result ? '#D1D5DB' : '#BFDBFE'}`,
            borderRadius: 6,
            color: result ? '#6B7280' : '#2563EB',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          {result ? '↺ Chạy lại' : '▶ Bắt đầu test'}
        </button>
      </div>
    </div>
  )
}

// ─── TestEnvModal ─────────────────────────────────────────────────────────────

function TestEnvModal({
  platform, initial, onConfirm, onCancel,
}: {
  platform: PlatformId
  initial: TestEnv
  onConfirm: (env: TestEnv) => void
  onCancel: () => void
}) {
  const meta = PLATFORM_META[platform]
  const [url, setUrl] = useState(initial.url || meta.defaultUrl)
  const [username, setUsername] = useState(initial.username || '')
  const [password, setPassword] = useState(initial.password || '')

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 10, width: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Cấu hình môi trường test</span>
          </div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Thông tin sẽ được lưu riêng cho platform này</div>
        </div>

        {/* Form */}
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>URL ứng dụng <span style={{ color: '#DC2626' }}>*</span></span>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="http://localhost:4000"
              style={{ padding: '7px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Tên đăng nhập</span>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              style={{ padding: '7px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ padding: '7px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none' }}
            />
          </label>
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{ padding: '7px 16px', border: '1px solid #D1D5DB', borderRadius: 6, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151' }}
          >
            Hủy
          </button>
          <button
            onClick={() => { if (url.trim()) onConfirm({ url: url.trim(), username: username.trim(), password }) }}
            disabled={!url.trim()}
            style={{
              padding: '7px 18px', border: 'none', borderRadius: 6,
              background: url.trim() ? '#2563EB' : '#E5E7EB',
              color: url.trim() ? '#fff' : '#9CA3AF',
              fontSize: 13, fontWeight: 600,
              cursor: url.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Lưu &amp; Bắt đầu →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TestRunModal ─────────────────────────────────────────────────────────────

function TestRunModal({
  result, tcTitle, onClose,
}: {
  result: TestRunResult
  tcTitle: string
  onClose: () => void
}) {
  const statusConfig = {
    queued:  { label: '⏳ Đang chờ...', color: '#6B7280', bg: '#F3F4F6' },
    running: { label: '🔄 Đang chạy...', color: '#2563EB', bg: '#EFF6FF' },
    pass:    { label: '✅ PASS', color: '#16A34A', bg: '#F0FDF4' },
    fail:    { label: '❌ FAIL', color: '#DC2626', bg: '#FEF2F2' },
    error:   { label: '⚠ Lỗi', color: '#D97706', bg: '#FFFBEB' },
  }
  const s = statusConfig[result.status]

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 10, width: 520, maxWidth: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
            ▶ Test tự động — {tcTitle}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
            background: s.bg, color: s.color,
          }}>
            {s.label}
          </span>
        </div>

        {/* Output log */}
        <pre style={{
          margin: 0, padding: '14px 18px',
          fontSize: 12, lineHeight: 1.7,
          fontFamily: "'Courier New', Courier, monospace",
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          minHeight: 160, maxHeight: 320, overflow: 'auto',
          background: '#1E1E2E', color: '#D4D4D4',
        }}>
          {result.output || 'Đang khởi động...'}
        </pre>

        {/* Step summary (when done) */}
        {result.steps && result.steps.length > 0 && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid #E5E7EB', maxHeight: 160, overflow: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>KẾT QUẢ TỪNG BƯỚC</div>
            {result.steps.map((s, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, marginBottom: 5, fontSize: 12,
                opacity: s.result === 'skip' ? 0.45 : 1,
              }}>
                <span style={{ flexShrink: 0, width: 20, textAlign: 'center' }}>
                  {s.result === 'pass' ? '✅' : s.result === 'fail' ? '❌' : '⏭'}
                </span>
                <span style={{ color: s.result === 'fail' ? '#DC2626' : s.result === 'skip' ? '#9CA3AF' : '#374151', textDecoration: s.result === 'skip' ? 'line-through' : 'none' }}>{s.step}</span>
                {s.note && s.result !== 'skip' && <span style={{ color: '#6B7280', fontStyle: 'italic' }}>— {s.note}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '7px 20px', border: '1px solid #D1D5DB', borderRadius: 6, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151', fontWeight: 500 }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
