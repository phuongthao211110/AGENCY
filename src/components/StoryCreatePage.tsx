import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ListKeymap from '@tiptap/extension-list-keymap';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  UndoOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { useDocument } from '../contexts/DocumentContext';

// ── Tokens ───────────────────────────────────────────────────────────────────

const C_LINK = '#3B82F6';
const C_TEXT_PRIMARY = '#111827';
const C_TEXT_SECONDARY = '#6B7280';
const C_BORDER = '#E5E7EB';
const C_ACTION = '#FF5200';
const C_BG_HEADER = '#F3F4F6';

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

const PLACEHOLDER_HTML = `<p><strong>User story</strong></p>
<p>Là [role], tôi muốn [action] để [benefit].</p>
<p><strong>User flow</strong></p>
<ol><li></li></ol>
<p><strong>Acceptance Criteria</strong></p>
<p><strong>AC1:</strong> </p>`;

export default function StoryCreatePage() {
  const { sectionKey } = useParams<{ sectionKey: string }>();
  const navigate = useNavigate();
  const { sections, createStory, saveStoryContent } = useDocument();

  const section = sections.find(s => s.key === sectionKey);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

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
    content: PLACEHOLDER_HTML,
    editorProps: {
      attributes: {
        class: 'story-editor',
        style: 'padding: 0',
      },
    },
  });

  if (!section) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
        Section không tồn tại.
      </div>
    );
  }

  const basePath = window.location.pathname.replace(/\/new\/.*$/, '');

  const handleSave = () => {
    if (!title.trim()) { setError('Tiêu đề là bắt buộc'); return; }
    if (!editor) return;
    setError('');

    const newId = `local-${sectionKey}-${Date.now()}`;
    createStory(sectionKey!, newId, title.trim());
    saveStoryContent(newId, { title: title.trim(), html: editor.getHTML() });
    navigate(`${basePath}/story/${newId}`);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

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
          Quay lại
        </button>

        <span style={{ color: C_BORDER, flexShrink: 0 }}>·</span>

        {/* Title input */}
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); setError(''); }}
          placeholder="Tiêu đề story... (bắt buộc)"
          autoFocus
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

        <span style={{
          fontSize: 11, color: C_LINK, background: '#EFF6FF',
          border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 4, flexShrink: 0,
        }}>
          {section.title}
        </span>

        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 14px', borderRadius: 6,
            border: 'none', background: C_ACTION,
            color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <CheckOutlined style={{ fontSize: 11 }} />
          Lưu story
        </button>
      </div>

      {error && (
        <div style={{ padding: '8px 24px', background: '#FFF1F2', borderBottom: '1px solid #FCA5A5', fontSize: 13, color: '#DC2626' }}>
          {error}
        </div>
      )}

      {/* ── Editor toolbar ── */}
      {editor && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          padding: '6px 20px', borderBottom: `1px solid ${C_BORDER}`,
          background: C_BG_HEADER, flexShrink: 0, flexWrap: 'wrap',
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
    </div>
  );
}
