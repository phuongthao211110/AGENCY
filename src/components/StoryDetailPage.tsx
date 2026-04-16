import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ListKeymap from '@tiptap/extension-list-keymap';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  CheckOutlined,
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  UndoOutlined,
  RedoOutlined,
  LikeOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useDocument, type DocStory } from '../contexts/DocumentContext';

// ── Tokens ───────────────────────────────────────────────────────────────────

const C_LINK = '#3B82F6';
const C_TEXT_PRIMARY = '#111827';
const C_TEXT_SECONDARY = '#6B7280';
const C_BORDER = '#E5E7EB';
const C_ACTION = '#FF5200';
const C_BG_HEADER = '#F3F4F6';

// ── HTML generator from structured JSON ──────────────────────────────────────

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateHtml(story: DocStory): string {
  const parts: string[] = [];

  if (story.userStory) {
    parts.push(`<p><strong>User story</strong></p>`);
    parts.push(`<p>${esc(story.userStory)}</p>`);
  }

  if (story.notes && story.notes.length > 0) {
    parts.push(`<p><strong>Notes</strong></p>`);
    parts.push(`<ul>${story.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`);
  }

  if (story.userFlow.length > 0) {
    parts.push(`<p><strong>User flow</strong></p>`);
    parts.push(`<ol>${story.userFlow.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`);
  }

  if (story.acceptanceCriteria.length > 0) {
    parts.push(`<p><strong>Acceptance Criteria</strong></p>`);
    story.acceptanceCriteria.forEach(ac => {
      const m = ac.match(/^(AC\d+):(.*)/);
      if (m) {
        parts.push(`<p><strong>${esc(m[1])}:</strong>${esc(m[2])}</p>`);
      } else {
        parts.push(`<p>${esc(ac)}</p>`);
      }
    });
  }

  if (!story.userStory && story.userFlow.length === 0 && story.acceptanceCriteria.length === 0) {
    parts.push(`<p></p>`);
  }

  return parts.join('\n');
}

// ── Toolbar Button ────────────────────────────────────────────────────────────

function ToolbarBtn({ onClick, active, disabled, title, children }: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 4, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? '#FFF4ED' : 'transparent',
        color: active ? C_ACTION : disabled ? '#D1D5DB' : C_TEXT_SECONDARY,
        fontSize: 13,
      }}
    >
      {children}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function StoryDetailPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { findStory, getStoryContent, saveStoryContent, deleteStory, hasContent, isLocalOnly, getStatus, updateStatus } = useDocument();

  const result = storyId ? findStory(storyId) : null;

  // Title state
  const [title, setTitle] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Status state
  type StoryStatus = NonNullable<ReturnType<typeof getStatus>>;
  const [storyStatus, setStoryStatus] = useState<StoryStatus>('draft');
  const [sentToast, setSentToast] = useState(false);
  const sentToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inject Tiptap styles once
  useEffect(() => {
    const id = 'story-editor-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      .story-editor { outline: none; min-height: 100%; font-family: inherit; font-size: 14px; line-height: 1.75; color: #111827; padding: 0; }
      .story-editor p { margin: 0 0 10px; }
      .story-editor h1 { font-size: 20px; font-weight: 800; margin: 24px 0 10px; }
      .story-editor h2 { font-size: 16px; font-weight: 700; margin: 20px 0 8px; }
      .story-editor h3 { font-size: 14px; font-weight: 700; margin: 16px 0 6px; }
      .story-editor ul { padding-left: 22px; margin: 0 0 10px; list-style-type: disc; }
      .story-editor ul ul { list-style-type: circle; }
      .story-editor ul ul ul { list-style-type: square; }
      .story-editor ol { padding-left: 22px; margin: 0 0 10px; list-style-type: decimal; }
      .story-editor ol ol { list-style-type: lower-alpha; }
      .story-editor li { margin-bottom: 4px; display: list-item; }
      .story-editor strong { font-weight: 700; }
      .story-editor em { font-style: italic; color: #6B7280; }
      .story-editor blockquote { border-left: 3px solid #E5E7EB; padding-left: 12px; color: #6B7280; margin: 8px 0; }
      .story-editor code { background: #F3F4F6; padding: 1px 5px; border-radius: 4px; font-size: 12px; font-family: monospace; }
      .story-editor pre { background: #1F2937; color: #F9FAFB; padding: 12px 16px; border-radius: 8px; overflow-x: auto; margin: 8px 0; }
      .story-editor pre code { background: none; color: inherit; }
    `;
    document.head.appendChild(style);
  }, []);

  const editor = useEditor({
    extensions: [StarterKit, ListKeymap],
    content: '',
    editorProps: {
      attributes: {
        class: 'story-editor',
        style: 'padding: 0',
      },
    },
    onUpdate: () => setIsDirty(true),
  });

  // When story changes, load content into editor
  useEffect(() => {
    if (!result || !editor) return;

    const saved = getStoryContent(result.story.id);
    const initTitle = saved?.title ?? result.story.title;
    const initHtml = saved?.html ?? generateHtml(result.story);

    setTitle(initTitle);
    editor.commands.setContent(initHtml);
    setIsDirty(false);
    setSaved(false);
  }, [storyId, editor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync status when story changes
  useEffect(() => {
    if (storyId) setStoryStatus(getStatus(storyId));
  }, [storyId, getStatus]);

  const handleApprove = () => {
    if (!result) return;
    const next: StoryStatus = storyStatus === 'draft' ? 'approved' : 'draft';
    updateStatus(result.story.id, next);
    setStoryStatus(next);
  };

  const handleSendToTech = () => {
    if (!result) return;
    updateStatus(result.story.id, 'sent-to-tech');
    setStoryStatus('sent-to-tech');
    setSentToast(true);
    if (sentToastRef.current) clearTimeout(sentToastRef.current);
    sentToastRef.current = setTimeout(() => setSentToast(false), 5000);
  };

  const handleSave = () => {
    if (!result || !editor) return;
    saveStoryContent(result.story.id, { title: title.trim() || result.story.title, html: editor.getHTML() });
    setIsDirty(false);
    setSaved(true);
    if (savedTimeout.current) clearTimeout(savedTimeout.current);
    savedTimeout.current = setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = () => {
    if (!result) return;
    if (!confirm(`Xóa story "${result.story.title}"?`)) return;
    const basePath = window.location.pathname.replace(/\/story\/.*$/, '');
    deleteStory(result.story.id);
    navigate(basePath);
  };

  if (!result) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
        Story không tồn tại.
      </div>
    );
  }

  const { story, section, isLocalOnly: localOnly } = { ...result, isLocalOnly: isLocalOnly(result.story.id) };
  const storyIndex = section.stories.findIndex(s => s.id === story.id);
  const edited = hasContent(story.id);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', position: 'relative' }}>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 24px', borderBottom: `1px solid ${C_BORDER}`,
        flexShrink: 0, background: '#fff',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, color: C_TEXT_SECONDARY,
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            flexShrink: 0,
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: 11 }} />
          {section.title}
        </button>

        <span style={{ color: C_BORDER, flexShrink: 0 }}>·</span>

        {/* Editable title */}
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
          placeholder="Tiêu đề story..."
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 700,
            color: C_TEXT_PRIMARY,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
            minWidth: 0,
          }}
        />

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {story.jiraKey && (
            <span style={{ fontSize: 11, fontWeight: 600, color: C_LINK, background: '#EFF6FF', border: `1px solid #BFDBFE`, padding: '2px 7px', borderRadius: 4 }}>
              {story.jiraKey}
            </span>
          )}
          {storyStatus === 'draft' && (
            <span style={{ fontSize: 11, color: '#6B7280', background: '#F3F4F6', border: '1px solid #D1D5DB', padding: '2px 7px', borderRadius: 4 }}>
              Draft
            </span>
          )}
          {storyStatus === 'approved' && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 7px', borderRadius: 4 }}>
              Approved
            </span>
          )}
          {storyStatus === 'sent-to-tech' && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 7px', borderRadius: 4 }}>
              Sent to Tech
            </span>
          )}
          {edited && !localOnly && (
            <span style={{ fontSize: 11, color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '2px 7px', borderRadius: 4 }}>
              Đã chỉnh sửa
            </span>
          )}
          {localOnly && (
            <span style={{ fontSize: 11, color: '#7C3AED', background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '2px 7px', borderRadius: 4 }}>
              Story mới
            </span>
          )}
        </div>

        {/* Actions */}
        {localOnly && (
          <button
            onClick={handleDelete}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 6,
              border: `1px solid #FCA5A5`, background: '#FFF1F2',
              color: '#DC2626', fontSize: 12, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <DeleteOutlined style={{ fontSize: 11 }} />
            Xóa
          </button>
        )}

        {storyStatus !== 'sent-to-tech' && (
          <button
            onClick={handleApprove}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 6,
              border: storyStatus === 'approved' ? '1px solid #A7F3D0' : '1px solid #D1D5DB',
              background: storyStatus === 'approved' ? '#ECFDF5' : '#F9FAFB',
              color: storyStatus === 'approved' ? '#059669' : '#6B7280',
              fontSize: 12, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <LikeOutlined style={{ fontSize: 11 }} />
            {storyStatus === 'approved' ? 'Bỏ duyệt' : 'Duyệt'}
          </button>
        )}
        {storyStatus === 'approved' && (
          <button
            onClick={handleSendToTech}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 6,
              border: '1px solid #93C5FD', background: '#EFF6FF',
              color: '#2563EB', fontSize: 12, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <SendOutlined style={{ fontSize: 11 }} />
            Gửi cho Tech
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={!isDirty}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 14px', borderRadius: 6,
            border: 'none',
            background: saved ? '#10B981' : isDirty ? C_ACTION : '#D1D5DB',
            color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: isDirty ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <CheckOutlined style={{ fontSize: 11 }} />
          {saved ? 'Đã lưu' : 'Lưu'}
        </button>
      </div>

      {/* ── Story number ── */}
      <div style={{ padding: '12px 24px 0', flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, fontWeight: 600 }}>
          Story #{storyIndex + 1} · {section.title}
        </span>
      </div>

      {/* ── Editor toolbar ── */}
      {editor && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          padding: '6px 20px', borderBottom: `1px solid ${C_BORDER}`,
          background: C_BG_HEADER, flexShrink: 0, flexWrap: 'wrap', marginTop: 10,
        }}>
          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <UndoOutlined />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <RedoOutlined />
          </ToolbarBtn>

          <div style={{ width: 1, height: 18, background: C_BORDER, margin: '0 3px' }} />

          {([1, 2, 3] as const).map(level => (
            <ToolbarBtn
              key={level}
              onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
              active={editor.isActive('heading', { level })}
              title={`Heading ${level}`}
            >
              <span style={{ fontSize: 11, fontWeight: 700 }}>H{level}</span>
            </ToolbarBtn>
          ))}

          <div style={{ width: 1, height: 18, background: C_BORDER, margin: '0 3px' }} />

          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
            <BoldOutlined />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
            <ItalicOutlined />
          </ToolbarBtn>

          <div style={{ width: 1, height: 18, background: C_BORDER, margin: '0 3px' }} />

          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
            <UnorderedListOutlined />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
            <OrderedListOutlined />
          </ToolbarBtn>

          <div style={{ width: 1, height: 18, background: C_BORDER, margin: '0 3px' }} />

          <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
            <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>"</span>
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <span style={{ fontSize: 11 }}>—</span>
          </ToolbarBtn>
        </div>
      )}

      {/* ── Editor body ── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '20px 24px 48px' }}>
        <EditorContent editor={editor} />
      </div>

      {/* ── Sent-to-tech toast ── */}
      {sentToast && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1F2937', color: '#fff', fontSize: 12, lineHeight: 1.6,
          padding: '10px 16px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          zIndex: 100, whiteSpace: 'nowrap',
        }}>
          Story đã được đánh dấu <strong>Sent to Tech</strong>. Nhờ Claude chạy{' '}
          <code style={{ background: '#374151', padding: '1px 5px', borderRadius: 3 }}>/generate-tech-backlog</code>{' '}
          để xuất file.
        </div>
      )}
    </div>
  );
}
