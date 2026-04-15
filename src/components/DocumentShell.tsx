import { useState } from 'react';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import { FileTextOutlined, PlusOutlined, RightOutlined, DownOutlined, LinkOutlined } from '@ant-design/icons';
import { DocumentProvider, useDocument, type DocumentData } from '../contexts/DocumentContext';

// ── Tokens ───────────────────────────────────────────────────────────────────

const C_LINK = '#3B82F6';
const C_TEXT_PRIMARY = '#111827';
const C_TEXT_SECONDARY = '#6B7280';
const C_BORDER = '#E5E7EB';
const C_ACTION = '#FF5200';
const C_BG_ACTIVE = '#FFF4ED';

// ── TOC ──────────────────────────────────────────────────────────────────────

function DocumentTOC() {
  const { sections, data } = useDocument();
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const location = useLocation();

  // Track which sections are expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    // Auto-expand the section containing the active story
    const init: Record<string, boolean> = {};
    for (const section of sections) {
      const hasActive = section.stories.some(s => s.id === storyId);
      if (hasActive || section.stories.length > 0) {
        init[section.key] = hasActive;
      }
    }
    return init;
  });

  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isOnHistory = location.pathname.endsWith('/document') && !storyId;
  const basePath = location.pathname.replace(/\/(story\/.*|new\/.*)$/, '').replace(/\/document.*$/, '/document');

  const totalStories = sections.reduce((acc, s) => acc + s.stories.length, 0);

  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <div style={{
      width: 220,
      flexShrink: 0,
      borderRight: `1px solid ${C_BORDER}`,
      overflowY: 'auto',
      background: '#FAFAFA',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${C_BORDER}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C_TEXT_SECONDARY, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          Mục lục
        </div>
        <div style={{ fontSize: 11, color: C_TEXT_SECONDARY }}>
          v{data.currentVersion} · {totalStories} stories · {formatDate(data.lastUpdated)}
        </div>
      </div>

      {/* Sections */}
      <div style={{ flex: 1, padding: '8px 0' }}>
        {sections.map(section => {
          const isExpanded = expanded[section.key];
          const isHovered = hoveredSection === section.key;

          return (
            <div key={section.key}>
              {/* Section row */}
              <div
                onMouseEnter={() => setHoveredSection(section.key)}
                onMouseLeave={() => setHoveredSection(null)}
                style={{ position: 'relative' }}
              >
                <div
                  onClick={() => toggleSection(section.key)}
                  style={{
                    padding: '7px 36px 7px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: C_TEXT_PRIMARY,
                    userSelect: 'none',
                  }}
                >
                  <span style={{ fontSize: 10, color: C_TEXT_SECONDARY, flexShrink: 0 }}>
                    {isExpanded ? <DownOutlined /> : <RightOutlined />}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {section.title}
                  </span>
                  {section.stories.length > 0 && (
                    <span style={{
                      fontSize: 10,
                      background: '#E5E7EB',
                      color: C_TEXT_SECONDARY,
                      borderRadius: 99,
                      padding: '1px 5px',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {section.stories.length}
                    </span>
                  )}
                </div>

                {/* Add story button */}
                {isHovered && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`${basePath}/new/${section.key}`);
                    }}
                    title={`Thêm story vào ${section.title}`}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      border: `1px solid ${C_BORDER}`,
                      background: '#fff',
                      color: C_ACTION,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    <PlusOutlined />
                  </button>
                )}
              </div>

              {/* Story list */}
              {isExpanded && (
                <div>
                  {section.stories.length === 0 ? (
                    <div style={{ padding: '4px 12px 4px 28px', fontSize: 12, color: C_TEXT_SECONDARY, fontStyle: 'italic' }}>
                      Chưa có story
                    </div>
                  ) : (
                    section.stories.map((story, idx) => {
                      const isActive = story.id === storyId;
                      const shortTitle = story.title.replace(/^\[.*?\]\s*/, '').split(':').slice(-1)[0].trim();
                      return (
                        <div
                          key={story.id}
                          onClick={() => navigate(`${basePath}/story/${story.id}`)}
                          style={{
                            padding: '5px 12px 5px 28px',
                            cursor: 'pointer',
                            fontSize: 12,
                            color: isActive ? C_ACTION : C_TEXT_SECONDARY,
                            fontWeight: isActive ? 600 : 400,
                            background: isActive ? C_BG_ACTIVE : 'transparent',
                            borderLeft: isActive ? `3px solid ${C_ACTION}` : '3px solid transparent',
                            lineHeight: 1.4,
                            transition: 'all 0.1s',
                          }}
                        >
                          {idx + 1}. {shortTitle}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer: version history link */}
      <div style={{ borderTop: `1px solid ${C_BORDER}`, padding: '8px 0' }}>
        <div
          onClick={() => navigate(basePath)}
          style={{
            padding: '7px 12px',
            cursor: 'pointer',
            fontSize: 12,
            color: isOnHistory ? C_ACTION : C_TEXT_SECONDARY,
            fontWeight: isOnHistory ? 600 : 400,
            background: isOnHistory ? C_BG_ACTIVE : 'transparent',
            borderLeft: isOnHistory ? `3px solid ${C_ACTION}` : '3px solid transparent',
          }}
        >
          Lịch sử phiên bản
        </div>
      </div>
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

function Shell() {
  const { data } = useDocument();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', overflow: 'hidden', background: '#fff' }}>
      {/* Page header */}
      <div style={{
        padding: '10px 24px',
        borderBottom: `1px solid ${C_BORDER}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        <FileTextOutlined style={{ fontSize: 16, color: C_LINK }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Document</span>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: C_LINK,
          background: '#EFF6FF',
          padding: '1px 7px',
          borderRadius: 99,
          border: `1px solid #BFDBFE`,
        }}>
          v{data.currentVersion}
        </span>
        <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
          {data.platform === 'super-admin' ? 'Super Admin' :
           data.platform === 'agency-admin' ? 'Agency Admin' : 'Web Shop'}
        </span>

        {data.figmaUrl && (
          <a
            href={data.figmaUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              color: C_TEXT_SECONDARY,
              textDecoration: 'none',
              border: `1px solid ${C_BORDER}`,
              padding: '4px 10px',
              borderRadius: 6,
            }}
          >
            <LinkOutlined />
            Figma
          </a>
        )}
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <DocumentTOC />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

// ── Exported wrapper ──────────────────────────────────────────────────────────

export default function DocumentShell({ data }: { data: DocumentData }) {
  return (
    <DocumentProvider data={data}>
      <Shell />
    </DocumentProvider>
  );
}
