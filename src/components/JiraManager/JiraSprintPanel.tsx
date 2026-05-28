import { useState } from 'react'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { JiraSprint, JiraIssue, JiraCache } from '../../hooks/useJiraApi'
import { C_ACTION, C_BORDER, C_TEXT_PRIMARY, C_TEXT_SECONDARY } from '../../theme/tokens'

type Props = {
  cache: JiraCache | null
  loading: boolean
  selectedIssueKey: string | null
  onSelectIssue: (issue: JiraIssue) => void
  onReload: () => void
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'To Do': { bg: '#F3F4F6', text: '#6B7280' },
  'In Progress': { bg: '#EFF6FF', text: '#3B82F6' },
  'Done': { bg: '#F0FDF4', text: '#16A34A' },
  'In Review': { bg: '#FFF7ED', text: '#D97706' },
  'Closed': { bg: '#F0FDF4', text: '#16A34A' },
  'Blocked': { bg: '#FEF2F2', text: '#DC2626' },
}

function getStatusStyle(statusName: string) {
  const key = Object.keys(STATUS_COLORS).find(
    (k) => statusName?.toLowerCase().includes(k.toLowerCase()),
  )
  return key ? STATUS_COLORS[key] : { bg: '#F3F4F6', text: '#6B7280' }
}

function formatCacheTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}


export default function JiraSprintPanel({ cache, loading, selectedIssueKey, onSelectIssue, onReload }: Props) {
  const [search, setSearch] = useState('')
  const [expandedSprints, setExpandedSprints] = useState<Set<number>>(() => {
    const s = new Set<number>()
    if (cache) {
      cache.sprints.filter((sp) => sp.state === 'active').forEach((sp) => s.add(sp.id))
    }
    return s
  })

  const allSprints = (cache?.sprints || []).slice().sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  )
  const issuesBySprint = cache?.issuesBySprint || {}

  function toggleSprint(id: number) {
    setExpandedSprints((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function filterIssues(issues: JiraIssue[]): JiraIssue[] {
    if (!search.trim()) return issues
    const q = search.toLowerCase()
    return issues.filter(
      (i) =>
        i.key.toLowerCase().includes(q) ||
        i.fields.summary.toLowerCase().includes(q) ||
        i.fields.status?.name?.toLowerCase().includes(q),
    )
  }

  const sprintStateLabel: Record<JiraSprint['state'], string> = {
    active: 'Active',
    closed: 'Closed',
    future: 'Upcoming',
  }

  const sprintStateBg: Record<JiraSprint['state'], string> = {
    active: '#D1FAE5',
    closed: '#F3F4F6',
    future: '#EFF6FF',
  }

  const sprintStateColor: Record<JiraSprint['state'], string> = {
    active: '#065F46',
    closed: '#6B7280',
    future: '#1D4ED8',
  }

  return (
    <div style={{
      width: 280, minWidth: 280,
      borderRight: `1px solid ${C_BORDER}`,
      display: 'flex', flexDirection: 'column',
      background: '#F9FAFB',
      overflow: 'hidden',
    }}>
      {/* Search + reload */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C_BORDER}`, background: '#fff' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6,
            border: `1px solid ${C_BORDER}`, borderRadius: 6,
            padding: '5px 8px', background: '#fff',
          }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 12 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm task..."
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontSize: 12, color: C_TEXT_PRIMARY, background: 'transparent',
              }}
            />
          </div>
          <button
            onClick={onReload}
            disabled={loading}
            title="Tải lại từ Jira"
            style={{
              padding: '5px 8px', borderRadius: 6,
              border: `1px solid ${C_BORDER}`, background: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: C_TEXT_SECONDARY, fontSize: 13,
              display: 'flex', alignItems: 'center',
            }}
          >
            <ReloadOutlined spin={loading} />
          </button>
        </div>
        {cache && (
          <div style={{ fontSize: 10, color: C_TEXT_SECONDARY, marginTop: 6 }}>
            Cập nhật: {formatCacheTime(cache.fetchedAt)}
          </div>
        )}
      </div>

      {/* Sprint list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && !cache && (
          <div style={{ padding: 20, textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 13 }}>
            Đang tải sprint từ Jira...
          </div>
        )}

        {!loading && !cache && (
          <div style={{ padding: 20, textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 13 }}>
            Chưa có dữ liệu
          </div>
        )}

        {allSprints.map((sprint) => {
          const rawIssues = issuesBySprint[sprint.id] || []
          const issues = filterIssues(rawIssues)
          const isExpanded = expandedSprints.has(sprint.id)
          const hasSearchResults = search.trim() ? issues.length > 0 : true

          if (search.trim() && !hasSearchResults) return null

          return (
            <div key={sprint.id}>
              {/* Sprint header */}
              <div
                onClick={() => toggleSprint(sprint.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${C_BORDER}`,
                  background: '#fff',
                  userSelect: 'none',
                }}
              >
                <span style={{ fontSize: 10, color: C_TEXT_SECONDARY, width: 10 }}>
                  {isExpanded ? '▼' : '▶'}
                </span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C_TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sprint.name}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  padding: '1px 6px', borderRadius: 10,
                  background: sprintStateBg[sprint.state],
                  color: sprintStateColor[sprint.state],
                }}>
                  {sprintStateLabel[sprint.state]}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  padding: '1px 6px', borderRadius: 10,
                  background: '#F3F4F6', color: '#374151',
                }}>
                  {rawIssues.length}
                </span>
              </div>

              {/* Issues */}
              {isExpanded && (
                <div>
                  {issues.length === 0 ? (
                    <div style={{ padding: '8px 16px', fontSize: 12, color: C_TEXT_SECONDARY, fontStyle: 'italic' }}>
                      {search.trim() ? 'Không tìm thấy task' : 'Không có task'}
                    </div>
                  ) : (
                    issues.map((issue) => {
                      const statusStyle = getStatusStyle(issue.fields.status?.name || '')
                      const isSelected = issue.key === selectedIssueKey
                      return (
                        <div
                          key={issue.key}
                          onClick={() => onSelectIssue(issue)}
                          style={{
                            padding: '7px 12px 7px 22px',
                            cursor: 'pointer',
                            borderBottom: `1px solid ${C_BORDER}`,
                            background: isSelected ? '#FFF4ED' : '#F9FAFB',
                            borderLeft: isSelected ? `3px solid ${C_ACTION}` : '3px solid transparent',
                            transition: 'background 0.1s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: isSelected ? C_ACTION : '#3B82F6' }}>
                              {issue.key}
                            </span>
                            <span style={{
                              fontSize: 10, padding: '1px 5px', borderRadius: 3,
                              background: statusStyle.bg, color: statusStyle.text, fontWeight: 500,
                            }}>
                              {issue.fields.status?.name || '—'}
                            </span>
                          </div>
                          <div style={{
                            fontSize: 12, color: isSelected ? C_TEXT_PRIMARY : '#374151',
                            fontWeight: isSelected ? 500 : 400,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.4',
                          }}>
                            {issue.fields.summary}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
