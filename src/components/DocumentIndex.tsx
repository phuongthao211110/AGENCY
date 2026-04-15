import { useDocument } from '../contexts/DocumentContext';

const C_LINK = '#3B82F6';
const C_TEXT_PRIMARY = '#111827';
const C_TEXT_SECONDARY = '#6B7280';
const C_BORDER = '#E5E7EB';
const C_BG_HEADER = '#F3F4F6';

export default function DocumentIndex() {
  const { data, sections } = useDocument();
  const totalStories = sections.reduce((acc, s) => acc + s.stories.length, 0);

  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '28px 36px 48px' }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Tổng user stories', value: totalStories, color: C_LINK },
          { label: 'Sections', value: sections.length, color: '#7C3AED' },
          { label: 'Phiên bản', value: `v${data.currentVersion}`, color: '#059669' },
          { label: 'Cập nhật', value: formatDate(data.lastUpdated), color: C_TEXT_SECONDARY },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1,
            background: '#FAFAFA',
            border: `1px solid ${C_BORDER}`,
            borderRadius: 8,
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: 11, color: C_TEXT_SECONDARY, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Version history */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C_TEXT_PRIMARY, marginBottom: 12 }}>
          Lịch sử phiên bản
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C_BG_HEADER }}>
              {['Phiên bản', 'Ngày', 'Thay đổi'].map((h, i) => (
                <th key={h} style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontSize: 12,
                  fontWeight: 600,
                  color: C_TEXT_SECONDARY,
                  border: `1px solid ${C_BORDER}`,
                  width: i === 0 ? 100 : i === 1 ? 120 : undefined,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...data.history].reverse().map((entry, idx) => (
              <tr key={entry.version} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, color: C_LINK, border: `1px solid ${C_BORDER}` }}>
                  v{entry.version}
                </td>
                <td style={{ padding: '8px 12px', fontSize: 13, color: C_TEXT_SECONDARY, border: `1px solid ${C_BORDER}` }}>
                  {formatDate(entry.date)}
                </td>
                <td style={{ padding: '8px 12px', fontSize: 13, color: C_TEXT_PRIMARY, border: `1px solid ${C_BORDER}` }}>
                  {entry.summary}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
