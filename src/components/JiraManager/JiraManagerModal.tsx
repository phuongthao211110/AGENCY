import { useState, useEffect } from 'react'
import { CloseOutlined, SettingOutlined } from '@ant-design/icons'
import { useJiraConfig } from '../../hooks/useJiraConfig'
import { loadCache, clearCache, fetchAndCacheAll, type JiraIssue, type JiraCache } from '../../hooks/useJiraApi'
import JiraConfigModal from './JiraConfigModal'
import JiraSprintPanel from './JiraSprintPanel'
import JiraTaskPanel, { PLATFORM_META, loadTestEnvs, saveTestEnvs, type PlatformId, type TestEnv, type TestEnvStore } from './JiraTaskPanel'
import { C_BORDER, C_TEXT_PRIMARY, C_TEXT_SECONDARY } from '../../theme/tokens'

type Props = {
  onClose: () => void
}

export default function JiraManagerModal({ onClose }: Props) {
  const { config, save: saveConfig } = useJiraConfig()
  const [showConfig, setShowConfig] = useState(!config)
  const [showEnvManager, setShowEnvManager] = useState(false)
  const [showQueueManager, setShowQueueManager] = useState(false)
  const [queueCount, setQueueCount] = useState(0)

  // Poll queue count every 5s
  useEffect(() => {
    const refresh = () => {
      fetch('/api/test-queue-list')
        .then(r => r.json())
        .then((items: Array<{ status?: string }>) => {
          setQueueCount(items.filter(i => i.status === 'queued' || i.status === 'running').length)
        })
        .catch(() => {})
    }
    refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [])
  const [cache, setCache] = useState<JiraCache | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null)

  // Load cache on mount or when config becomes available
  useEffect(() => {
    if (!config) return
    const cached = loadCache()
    if (cached && cached.projectKey === config.projectKey) {
      setCache(cached)
      // Auto-select first issue of active sprint
      autoSelectFirst(cached)
    } else {
      doFetch()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function autoSelectFirst(c: JiraCache) {
    const activeSprint = c.sprints.find((s) => s.state === 'active')
    if (activeSprint) {
      const issues = c.issuesBySprint[activeSprint.id] || []
      if (issues.length > 0) setSelectedIssue(issues[0])
    }
  }

  async function doFetch() {
    if (!config) return
    setLoading(true)
    setError(null)
    try {
      const newCache = await fetchAndCacheAll(config)
      setCache(newCache)
      autoSelectFirst(newCache)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  function handleReload() {
    clearCache()
    setCache(null)
    doFetch()
  }

  function handleConfigSave(c: Parameters<typeof saveConfig>[0]) {
    saveConfig(c)
    setShowConfig(false)
    // If project key changed, reload
    if (!cache || cache.projectKey !== c.projectKey) {
      clearCache()
      setCache(null)
      setTimeout(doFetch, 100)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}
      />

      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '96vw', height: '92vh',
          maxWidth: 1280,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          zIndex: 1001,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px',
          height: 48,
          borderBottom: `1px solid ${C_BORDER}`,
          background: '#fff', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M11.53 2L2 11.53l4.97 4.97L11.53 12l4.97 4.97L21.47 12 11.53 2z" fill="#2684FF" />
              <path d="M11.53 22l9.53-9.53-4.97-4.97L11.53 12 6.56 7.03 2.07 11.5 11.53 22z" fill="#2684FF" opacity="0.5" />
            </svg>
            <span style={{ fontWeight: 700, fontSize: 15, color: C_TEXT_PRIMARY }}>
              Jira Sprint Manager
            </span>
          </div>

          {config && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              padding: '2px 8px', borderRadius: 4,
              background: '#EFF6FF', color: '#1D4ED8',
            }}>
              {config.projectKey}
            </span>
          )}

          <div style={{ flex: 1 }} />

          <button
            onClick={() => setShowQueueManager(true)}
            style={{
              padding: '5px 10px', borderRadius: 6,
              border: `1px solid ${queueCount > 0 ? '#BFDBFE' : C_BORDER}`,
              background: queueCount > 0 ? '#EFF6FF' : '#fff',
              cursor: 'pointer', fontSize: 12,
              color: queueCount > 0 ? '#2563EB' : C_TEXT_SECONDARY,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            📋 Test Queue
            {queueCount > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: '#2563EB', color: '#fff',
                borderRadius: 10, padding: '1px 6px', lineHeight: '14px',
              }}>
                {queueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowEnvManager(true)}
            style={{
              padding: '5px 10px', borderRadius: 6,
              border: `1px solid ${C_BORDER}`, background: '#fff',
              cursor: 'pointer', fontSize: 12, color: C_TEXT_SECONDARY,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            🖥 Môi trường
          </button>

          <button
            onClick={() => setShowConfig(true)}
            style={{
              padding: '5px 10px', borderRadius: 6,
              border: `1px solid ${C_BORDER}`, background: '#fff',
              cursor: 'pointer', fontSize: 12, color: C_TEXT_SECONDARY,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <SettingOutlined style={{ fontSize: 12 }} />
            Cài đặt
          </button>

          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: `1px solid ${C_BORDER}`, background: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C_TEXT_SECONDARY, fontSize: 13,
            }}
          >
            <CloseOutlined />
          </button>
        </div>

        {/* Body */}
        {!config ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
            Chưa cấu hình — nhấn "Cài đặt" để bắt đầu
          </div>
        ) : error ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ color: '#DC2626', fontSize: 14 }}>⚠️ {error}</div>
            <button
              onClick={doFetch}
              style={{
                padding: '7px 16px', borderRadius: 6,
                border: `1px solid ${C_BORDER}`, background: '#fff',
                cursor: 'pointer', fontSize: 13, color: C_TEXT_PRIMARY,
              }}
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <JiraSprintPanel
              cache={cache}
              loading={loading}
              selectedIssueKey={selectedIssue?.key || null}
              onSelectIssue={setSelectedIssue}
              onReload={handleReload}
            />

            {selectedIssue ? (
              <JiraTaskPanel
                key={selectedIssue.key}
                issue={selectedIssue}
                config={config}
              />
            ) : (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C_TEXT_SECONDARY, fontSize: 13,
              }}>
                {loading ? 'Đang tải sprint tasks...' : 'Chọn một task từ danh sách bên trái'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Config modal (nested) */}
      {showConfig && (
        <div style={{ zIndex: 1200, position: 'relative' }}>
          <JiraConfigModal
            initial={config}
            onSave={handleConfigSave}
            onClose={config ? () => setShowConfig(false) : undefined}
          />
        </div>
      )}

      {/* Test Env Manager */}
      {showEnvManager && (
        <div style={{ zIndex: 1200, position: 'relative' }}>
          <TestEnvManagerModal onClose={() => setShowEnvManager(false)} />
        </div>
      )}

      {/* Test Queue Manager */}
      {showQueueManager && (
        <div style={{ zIndex: 1200, position: 'relative' }}>
          <TestQueueManagerModal onClose={() => setShowQueueManager(false)} />
        </div>
      )}
    </>
  )
}

// ─── TestEnvManagerModal ──────────────────────────────────────────────────────

const ALL_PLATFORMS: PlatformId[] = ['agency', 'ghn', 'web-shop', 'app-shop']

function TestEnvManagerModal({ onClose }: { onClose: () => void }) {
  const [envs, setEnvs] = useState<TestEnvStore>(() => loadTestEnvs())
  const [editing, setEditing] = useState<PlatformId | null>(null)
  const [draft, setDraft] = useState<TestEnv>({})
  const [saved, setSaved] = useState(false)

  function startEdit(platform: PlatformId) {
    const meta = PLATFORM_META[platform]
    setDraft(envs[platform] || { url: meta.defaultUrl, username: '', password: '' })
    setEditing(platform)
    setSaved(false)
  }

  function saveDraft() {
    if (!editing) return
    const updated = { ...envs, [editing]: draft }
    setEnvs(updated)
    saveTestEnvs(updated)
    setSaved(true)
    setTimeout(() => { setSaved(false); setEditing(null) }, 800)
  }

  function clearEnv(platform: PlatformId) {
    const updated = { ...envs }
    delete updated[platform]
    setEnvs(updated)
    saveTestEnvs(updated)
    if (editing === platform) setEditing(null)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1200 }} />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 560, maxHeight: '80vh',
          background: '#fff', borderRadius: 12,
          boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          zIndex: 1201, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#F9FAFB', flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', flex: 1 }}>🖥 Quản lý môi trường test</span>
          <button
            onClick={onClose}
            style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', color: '#6B7280', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* Platform list */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {ALL_PLATFORMS.map((platform, i) => {
            const meta = PLATFORM_META[platform]
            const env = envs[platform]
            const isEditing = editing === platform

            return (
              <div key={platform} style={{ borderBottom: i < ALL_PLATFORMS.length - 1 ? '1px solid #E5E7EB' : undefined }}>
                {/* Row header */}
                <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4,
                    background: meta.bg, color: meta.color, flexShrink: 0, minWidth: 90, textAlign: 'center',
                  }}>
                    {meta.label}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {env?.url ? (
                      <>
                        <div style={{ fontSize: 12, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {env.url}
                        </div>
                        {env.username && (
                          <div style={{ fontSize: 11, color: '#6B7280' }}>
                            👤 {env.username} &nbsp;🔑 ••••••
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>Chưa cấu hình</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => isEditing ? setEditing(null) : startEdit(platform)}
                      style={{
                        padding: '4px 12px', borderRadius: 5, fontSize: 12, fontWeight: 600,
                        border: `1px solid ${isEditing ? '#D1D5DB' : meta.color}`,
                        background: isEditing ? '#F3F4F6' : meta.bg,
                        color: isEditing ? '#6B7280' : meta.color, cursor: 'pointer',
                      }}
                    >
                      {isEditing ? 'Hủy' : env?.url ? 'Sửa' : 'Cấu hình'}
                    </button>
                    {env?.url && !isEditing && (
                      <button
                        onClick={() => clearEnv(platform)}
                        style={{ padding: '4px 10px', borderRadius: 5, fontSize: 12, border: '1px solid #E5E7EB', background: '#fff', color: '#DC2626', cursor: 'pointer' }}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && (
                  <div style={{ padding: '0 20px 16px', background: '#FAFAFA', borderTop: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12 }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>URL ứng dụng <span style={{ color: '#DC2626' }}>*</span></span>
                        <input
                          value={draft.url || ''}
                          onChange={e => setDraft(d => ({ ...d, url: e.target.value }))}
                          placeholder={meta.defaultUrl}
                          style={{ padding: '7px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none' }}
                        />
                      </label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Tên đăng nhập</span>
                          <input
                            value={draft.username || ''}
                            onChange={e => setDraft(d => ({ ...d, username: e.target.value }))}
                            placeholder="admin"
                            style={{ padding: '7px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none' }}
                          />
                        </label>
                        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Mật khẩu</span>
                          <input
                            type="password"
                            value={draft.password || ''}
                            onChange={e => setDraft(d => ({ ...d, password: e.target.value }))}
                            placeholder="••••••••"
                            style={{ padding: '7px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none' }}
                          />
                        </label>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={saveDraft}
                          disabled={!draft.url?.trim()}
                          style={{
                            padding: '7px 20px', borderRadius: 6, border: 'none', fontWeight: 600, fontSize: 13,
                            background: saved ? '#16A34A' : (draft.url?.trim() ? meta.color : '#E5E7EB'),
                            color: draft.url?.trim() ? '#fff' : '#9CA3AF',
                            cursor: draft.url?.trim() ? 'pointer' : 'not-allowed',
                            transition: 'background 0.2s',
                          }}
                        >
                          {saved ? '✓ Đã lưu' : 'Lưu'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #E5E7EB', background: '#F9FAFB' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>
            💡 Platform được tự động nhận diện từ tiêu đề task Jira (ví dụ: [AGENCY], [GHN], [SHOP])
          </div>
        </div>
      </div>
    </>
  )
}

// ─── TestQueueManagerModal ────────────────────────────────────────────────────

type QueueItem = {
  id: string
  status: 'queued' | 'running' | 'pass' | 'fail' | 'error'
  issueKey: string
  tcId?: string
  testCase?: { id: string; title: string; type: string }
  queuedAt?: string
  completedAt?: string
  output?: string
  _location: 'queue' | 'results'
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  queued:  { label: '⏳ Chờ',      color: '#D97706', bg: '#FFFBEB' },
  running: { label: '🔄 Đang chạy', color: '#2563EB', bg: '#EFF6FF' },
  pass:    { label: '✅ Pass',      color: '#16A34A', bg: '#F0FDF4' },
  fail:    { label: '❌ Fail',      color: '#DC2626', bg: '#FEF2F2' },
  error:   { label: '⚠ Lỗi',       color: '#D97706', bg: '#FFFBEB' },
}

function TestQueueManagerModal({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewOutput, setViewOutput] = useState<QueueItem | null>(null)

  const refresh = () => {
    fetch('/api/test-queue-list')
      .then(r => r.json())
      .then((data: QueueItem[]) => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 3000)
    return () => clearInterval(t)
  }, [])

  async function handleDelete(id: string) {
    await fetch(`/api/test-delete/${id}`, { method: 'DELETE' })
    refresh()
  }

  async function handleClearAll() {
    const queued = items.filter(i => i.status === 'queued')
    await Promise.all(queued.map(i => fetch(`/api/test-delete/${i.id}`, { method: 'DELETE' })))
    refresh()
  }

  const queuedCount = items.filter(i => i.status === 'queued' || i.status === 'running').length

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1200 }} />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 640, maxHeight: '80vh',
          background: '#fff', borderRadius: 12,
          boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          zIndex: 1201, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#F9FAFB', flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', flex: 1 }}>
            📋 Test Queue
            {queuedCount > 0 && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#DBEAFE', color: '#1D4ED8' }}>
                {queuedCount} đang chờ
              </span>
            )}
          </span>
          {queuedCount > 0 && (
            <button
              onClick={handleClearAll}
              style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              🗑 Xóa tất cả queue
            </button>
          )}
          <button
            onClick={refresh}
            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 12, cursor: 'pointer' }}
          >
            ↻ Làm mới
          </button>
          <button
            onClick={onClose}
            style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', color: '#6B7280', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>Đang tải...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              Queue trống — chưa có test nào được gửi
            </div>
          ) : (
            items.map((item, i) => {
              const s = STATUS_META[item.status] || STATUS_META.error
              const tc = item.testCase
              const time = item.queuedAt || item.completedAt
              const isQueued = item.status === 'queued' || item.status === 'running'
              return (
                <div key={item.id} style={{
                  padding: '12px 20px',
                  borderBottom: i < items.length - 1 ? '1px solid #F3F4F6' : undefined,
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: isQueued ? '#FAFAFA' : '#fff',
                }}>
                  {/* Status */}
                  <span style={{
                    flexShrink: 0, fontSize: 10, fontWeight: 700,
                    padding: '3px 8px', borderRadius: 10,
                    background: s.bg, color: s.color, marginTop: 2,
                  }}>
                    {s.label}
                  </span>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6' }}>{item.issueKey}</span>
                      {tc && <span style={{ fontSize: 11, color: '#6B7280' }}>— {tc.id}</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tc?.title || item.id}
                    </div>
                    {time && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {item._location === 'queue' ? '🕐 Queued' : '🕐 Done'}: {new Date(time).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {item.output && (
                      <button
                        onClick={() => setViewOutput(item)}
                        style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', cursor: 'pointer' }}
                      >
                        Xem log
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}
                    >
                      {isQueued ? 'Hủy' : 'Xóa'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer note */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>
            💡 Các test đang chờ sẽ được Claude thực hiện tự động. Nhắn "check test queue" trong chat để chạy ngay.
          </div>
        </div>
      </div>

      {/* Output viewer */}
      {viewOutput && (
        <>
          <div onClick={() => setViewOutput(null)} style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.3)' }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 560, background: '#1E1E2E', borderRadius: 10,
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)', zIndex: 1301, overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #2D2D3F', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#D4D4D4', flex: 1 }}>
                {viewOutput.testCase?.id} — {viewOutput.testCase?.title}
              </span>
              <button onClick={() => setViewOutput(null)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <pre style={{ margin: 0, padding: '14px 16px', fontSize: 12, lineHeight: 1.7, color: '#D4D4D4', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 360, overflow: 'auto' }}>
              {viewOutput.output}
            </pre>
          </div>
        </>
      )}
    </>
  )
}
