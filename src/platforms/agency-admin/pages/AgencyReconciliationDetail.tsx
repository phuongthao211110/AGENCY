import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftOutlined } from '@ant-design/icons'

export default function AgencyReconciliationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  return (
    <div style={{ padding: 24, background: '#fff', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <span
          onClick={() => navigate('/agency-admin/reconciliation')}
          style={{ cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}
        >
          <ArrowLeftOutlined /> Đối soát & Chuyển khoản
        </span>
        <span style={{ color: '#E5E7EB' }}>/</span>
        <span style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>{id}</span>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>
        Chi tiết phiên {id}
      </h1>
      <p style={{ color: '#6B7280', fontSize: 14 }}>
        Tính năng chi tiết phiên sẽ được implement trong Sprint 3.
      </p>
    </div>
  )
}
