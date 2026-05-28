import { useState } from 'react'
import { CloseOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { JiraConfig } from '../../hooks/useJiraConfig'
import { testConnection } from '../../hooks/useJiraApi'
import { C_ACTION, C_BORDER, C_TEXT_PRIMARY, C_TEXT_SECONDARY } from '../../theme/tokens'

type Props = {
  initial: JiraConfig | null
  onSave: (config: JiraConfig) => void
  onClose?: () => void
}

export default function JiraConfigModal({ initial, onSave, onClose }: Props) {
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [apiToken, setApiToken] = useState(initial?.apiToken || '')
  const [projectKey, setProjectKey] = useState(initial?.projectKey || '')
  const [claudeApiKey, setClaudeApiKey] = useState(initial?.claudeApiKey || '')

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const canTest = baseUrl && email && apiToken
  const canSave = canTest && projectKey

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const user = await testConnection({ baseUrl, email, apiToken, projectKey })
      setTestResult({ ok: true, message: `Kết nối thành công · ${user.displayName} (${user.emailAddress})` })
    } catch (err) {
      setTestResult({ ok: false, message: String(err) })
    } finally {
      setTesting(false)
    }
  }

  function handleSave() {
    if (!canSave) return
    onSave({
      baseUrl: baseUrl.replace(/\/$/, ''),
      email,
      apiToken,
      projectKey: projectKey.toUpperCase(),
      claudeApiKey: claudeApiKey || undefined,
    })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          width: 520,
          maxWidth: '95vw',
          maxHeight: '92vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: `1px solid ${C_BORDER}`,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: C_TEXT_PRIMARY }}>Cấu hình Jira</div>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
              Kết nối prototype với Jira để load sprint tasks
            </div>
          </div>
          {onClose && (
            <div
              onClick={onClose}
              style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, fontSize: 18, padding: 4 }}
            >
              <CloseOutlined />
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field
            label="Jira Base URL *"
            placeholder="https://yourcompany.atlassian.net"
            value={baseUrl}
            onChange={setBaseUrl}
          />
          <Field
            label="Email *"
            placeholder="your@email.com"
            value={email}
            onChange={setEmail}
          />
          <Field
            label="API Token *"
            placeholder="Tạo tại id.atlassian.com → Security → API tokens"
            value={apiToken}
            onChange={setApiToken}
            type="password"
          />
          <Field
            label="Project Key *"
            placeholder="Ví dụ: AGENCY, GHN, SPRINT"
            value={projectKey}
            onChange={(v) => setProjectKey(v.toUpperCase())}
          />

          <div style={{ borderTop: `1px solid ${C_BORDER}`, paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C_TEXT_SECONDARY, marginBottom: 12, letterSpacing: 0.5 }}>
              TÙY CHỌN
            </div>
            <Field
              label="Claude API Key (để AI tự viết story)"
              placeholder="sk-ant-api03-..."
              value={claudeApiKey}
              onChange={setClaudeApiKey}
              type="password"
            />
          </div>

          {/* Test result */}
          {testResult && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '10px 12px', borderRadius: 6,
              background: testResult.ok ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${testResult.ok ? '#BBF7D0' : '#FECACA'}`,
              fontSize: 13,
              color: testResult.ok ? '#166534' : '#991B1B',
            }}>
              {testResult.ok
                ? <CheckCircleOutlined style={{ marginTop: 1 }} />
                : <ExclamationCircleOutlined style={{ marginTop: 1 }} />
              }
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'flex-end',
          padding: '12px 24px',
          borderTop: `1px solid ${C_BORDER}`,
        }}>
          <button
            onClick={handleTest}
            disabled={!canTest || testing}
            style={{
              padding: '7px 16px', borderRadius: 6,
              border: `1px solid ${C_BORDER}`,
              background: '#fff', cursor: canTest ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 500,
              color: canTest ? C_TEXT_PRIMARY : C_TEXT_SECONDARY,
              opacity: testing ? 0.7 : 1,
            }}
          >
            {testing ? 'Đang kiểm tra...' : 'Test kết nối'}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              padding: '7px 20px', borderRadius: 6,
              border: 'none',
              background: canSave ? C_ACTION : '#E5E7EB',
              color: canSave ? '#fff' : C_TEXT_SECONDARY,
              cursor: canSave ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 600,
            }}
          >
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, placeholder, value, onChange, type = 'text',
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: C_TEXT_PRIMARY, marginBottom: 5 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '7px 10px',
          border: `1px solid ${C_BORDER}`, borderRadius: 6,
          fontSize: 13, color: C_TEXT_PRIMARY,
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />
    </div>
  )
}
