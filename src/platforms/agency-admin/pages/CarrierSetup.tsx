import React, { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  PlusOutlined,
  ApiOutlined,
  AppstoreOutlined,
  DollarOutlined,
  SearchOutlined,
  DisconnectOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import allPriceTables from '../../../mock-data/pricing.json'
import { agenciesList, shopConnections, addShopRequest, carrierRequests, addCarrierRequest, clientHubs247, findPastHubRejection, type ClientHub247 } from '../../super-admin/agencyStore'
import AgencyServices from './AgencyServices'

const CURRENT_AGENCY_ID = 'AGN001'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_LINK           = '#3B82F6'
const C_BORDER         = '#E5E7EB'
const C_ACTION         = '#FF5200'
const C_BG_HEADER      = '#F3F4F6'

// ─── Carrier config ───────────────────────────────────────────────────────────
type CarrierKey = 'GHN' | '247Express'

const CARRIERS: { key: CarrierKey; label: string; fullName: string; color: string }[] = [
  { key: 'GHN',        label: 'GHN',        fullName: 'Giao Hàng Nhanh', color: '#EE4D2D' },
  { key: '247Express', label: '247Express',  fullName: '247Express',      color: '#1677FF' },
]

// ─── Tab bar ──────────────────────────────────────────────────────────────────
type Tab = 'connect' | 'services' | 'pricing'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'connect',  label: 'Kết nối',   icon: <ApiOutlined /> },
  { key: 'services', label: 'Dịch vụ',   icon: <AppstoreOutlined /> },
  { key: 'pricing',  label: 'Bảng giá',  icon: <DollarOutlined /> },
]

// ─── Add Shop Modal (GHN only) ────────────────────────────────────────────────
const OTP_LENGTH     = 6
const RESEND_SECONDS = 600

function AddShopModal({ carrier, onClose, onRequestSent }: { carrier: CarrierKey; onClose: () => void; onRequestSent: () => void }) {
  const [step, setStep]         = useState<'form' | 'otp' | 'success'>('form')
  const [phone, setPhone]       = useState('')
  const [clientId, setClientId] = useState('')
  const [otp, setOtp]           = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(OTP_LENGTH).fill(null))

  const startCountdown = () => {
    setCountdown(RESEND_SECONDS)
    const interval = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(interval); return 0 } return c - 1 })
    }, 1000)
  }

  const handleConnect = () => {
    setStep('otp')
    startCountdown()
    setTimeout(() => otpRefs.current[0]?.focus(), 50)
  }

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]; next[index] = digit; setOtp(next)
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  const fmtCountdown = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')} phút` : `${sec} giây`
  }

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${C_BORDER}`, borderRadius: 10, padding: '12px 16px',
    fontSize: 15, color: C_TEXT_PRIMARY, outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -3px rgba(0,0,0,0.04)', width: 520, position: 'relative', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C_BORDER}` }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY }}>Kết nối tài khoản {carrier}</span>
          <button onClick={onClose} style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C_TEXT_SECONDARY, fontSize: 14, borderRadius: 4 }}>
            <CloseOutlined />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 20px' }}>
        {step === 'form' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, color: C_TEXT_LABEL }}>SĐT tài khoản {carrier}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={`SĐT tài khoản ${carrier}`} style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')}
                onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, color: C_TEXT_LABEL }}>ID cửa hàng {carrier}</label>
              <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder={`ID cửa hàng ${carrier}`} style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')}
                onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={handleConnect} style={{ padding: '9px 20px', background: C_ACTION, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Kết nối
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ textAlign: 'center', fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
              <div>Vui lòng nhập mã OTP đã được gửi về số điện thoại</div>
              <div>
                <span>{phone || '0909000999'} </span>
                <span onClick={() => setStep('form')} style={{ fontWeight: 600, color: C_ACTION, cursor: 'pointer' }}>Thay đổi số điện thoại</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {otp.map((digit, i) => (
                <input key={i} ref={(el) => { otpRefs.current[i] = el }} value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  maxLength={1} inputMode="numeric"
                  style={{ width: 56, height: 56, border: `1px solid ${digit ? '#FFA274' : C_BORDER}`, borderRadius: 6, textAlign: 'center', fontSize: 20, fontWeight: 600, color: C_TEXT_PRIMARY, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = digit ? '#FFA274' : C_BORDER)} />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                onClick={() => {
                  addShopRequest({
                    agencyId: CURRENT_AGENCY_ID,
                    carrier,
                    shopId: `NEW-${phone.slice(-4)}`,
                    name: `Shop mới (${phone})`,
                    phone,
                    clientId,
                  })
                  onRequestSent()
                  setStep('success')
                }}
                style={{ width: '100%', padding: '9px 12px', background: C_ACTION, border: 'none', borderRadius: 6, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Xác nhận
              </button>
              <button disabled={countdown > 0} onClick={() => countdown === 0 && startCountdown()}
                style={{ width: '100%', padding: '9px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, color: countdown > 0 ? '#9CA3AF' : C_TEXT_PRIMARY, fontSize: 14, fontWeight: 600, cursor: countdown > 0 ? 'default' : 'pointer' }}>
                {countdown > 0 ? `Gửi lại mã OTP (Sau ${fmtCountdown(countdown)})` : 'Gửi lại mã OTP'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '8px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28 }}>✓</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C_TEXT_PRIMARY, marginBottom: 8 }}>Đã gửi yêu cầu kết nối</div>
              <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>
                GHN sẽ xem xét và phê duyệt yêu cầu trong <strong>1–2 ngày làm việc</strong>.<br />
                Shop sẽ được kích hoạt sau khi GHN duyệt.
              </div>
            </div>
            <button onClick={onClose} style={{ width: '100%', padding: '9px 12px', background: C_ACTION, border: 'none', borderRadius: 6, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Đóng
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Yêu cầu thêm địa điểm gửi hàng (chỉ hiện khi 247Express đã kích hoạt) ────
// Đại lý chỉ được CHỌN từ catalog địa điểm có sẵn (clientHubs247) chưa được phân cho mình —
// không tự tạo địa điểm mới (đó là việc của Super Admin).
function RequestHubModal({ availableHubs, onClose, onSubmit }: {
  availableHubs: ClientHub247[]
  onClose: () => void
  onSubmit: (data: { hubIds: string[]; note: string }) => void
}) {
  const [selectedHubs, setSelectedHubs] = useState<string[]>([])
  const [note, setNote] = useState('')

  const toggleHub = (id: string) =>
    setSelectedHubs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C_BORDER}`, position: 'sticky', top: 0, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#7C3AED', display: 'inline-block' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: C_TEXT_PRIMARY }}>Yêu cầu thêm địa điểm gửi hàng</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C_TEXT_SECONDARY, fontSize: 18, lineHeight: 1 }}>
            <CloseOutlined />
          </button>
        </div>
        <div style={{ padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0369A1' }}>Về việc cấp thêm địa điểm gửi hàng</div>
            <div style={{ fontSize: 13, color: '#0C4A6E', lineHeight: 1.5 }}>Chọn một hoặc nhiều địa điểm có sẵn để Super Admin xem xét và phân thêm cho đại lý — ví dụ khi mở rộng kho hàng sang khu vực mới.</div>
          </div>

          {availableHubs.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: C_TEXT_SECONDARY, background: C_BG_HEADER, borderRadius: 8 }}>
              Không còn địa điểm nào khả dụng — liên hệ Super Admin để tạo thêm.
            </div>
          ) : (
            <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${C_BORDER}` }}>
              {availableHubs.map((hub, i) => {
                const isSelected = selectedHubs.includes(hub.id)
                const pastRejection = findPastHubRejection(CURRENT_AGENCY_ID, '247Express', hub.id)
                return (
                  <div key={hub.id}>
                    <div
                      onClick={() => toggleHub(hub.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', background: isSelected ? '#FFF9F7' : '#fff' }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        border: isSelected ? 'none' : '1.5px solid #D1D5DB',
                        background: isSelected ? C_ACTION : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 3.5L3.8 6.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', fontFamily: 'monospace' }}>{hub.id}</span>
                          {pastRejection && (
                            <span
                              title={`Đã từng bị từ chối (${pastRejection.requestedAt}) — Lý do: ${pastRejection.rejectionReason || '(không có lý do cụ thể)'}`}
                              style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 8, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', cursor: 'help', whiteSpace: 'nowrap' }}
                            >
                              ⚠ Đã từng bị từ chối
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
                          <span style={{ fontWeight: 500, color: C_TEXT_PRIMARY }}>{hub.name}</span> — {hub.location}
                        </div>
                        {pastRejection && (
                          <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>
                            Lý do lần trước: {pastRejection.rejectionReason || '(không có lý do cụ thể)'}
                          </div>
                        )}
                      </div>
                    </div>
                    {i < availableHubs.length - 1 && <div style={{ height: 1, background: '#F5F5F5' }} />}
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_LABEL }}>Ghi chú (tùy chọn)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Nêu lý do hoặc khu vực cần thêm điểm lấy hàng..."
              rows={3}
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C_BORDER}`, borderRadius: 8, fontSize: 13, color: C_TEXT_PRIMARY, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: `1px solid ${C_BORDER}`, background: '#FAFAFA' }}>
          <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 6, border: `1px solid ${C_BORDER}`, background: '#fff', fontSize: 13, color: C_TEXT_SECONDARY, cursor: 'pointer', fontWeight: 500 }}>
            Huỷ
          </button>
          <button
            disabled={selectedHubs.length === 0}
            onClick={() => selectedHubs.length > 0 && onSubmit({ hubIds: selectedHubs, note })}
            style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: selectedHubs.length > 0 ? C_ACTION : '#D1D5DB', color: '#fff', fontSize: 13, fontWeight: 700, cursor: selectedHubs.length > 0 ? 'pointer' : 'not-allowed' }}>
            Gửi yêu cầu ({selectedHubs.length})
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Kết nối — 247Express ────────────────────────────────────────────────
function TabConnect247() {
  const agency = agenciesList.find(a => a.id === CURRENT_AGENCY_ID)
  const hubs = (agency?.clientHubIds ?? []).map(id => clientHubs247.find(h => h.id === id)).filter((h): h is ClientHub247 => !!h)
  const isActivated = hubs.length > 0
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [, forceRender] = useState(0)
  const pendingHubRequest = carrierRequests.find(
    r => r.agencyId === CURRENT_AGENCY_ID && r.carrier === '247Express' && r.status === 'pending'
  )
  // Yêu cầu cấp thêm hub gần nhất bị Super Admin từ chối — nếu không hiện rõ, đại lý chỉ thấy
  // nút "+ Yêu cầu thêm địa điểm gửi hàng" quay lại bình thường, tưởng nhầm là chưa từng gửi.
  const rejectedHubRequest = !pendingHubRequest &&
    [...carrierRequests].reverse().find(r => r.agencyId === CURRENT_AGENCY_ID && r.carrier === '247Express' && r.status === 'rejected')
  const availableHubs = clientHubs247.filter(h => !(agency?.clientHubIds ?? []).includes(h.id))

  const handleSubmitRequest = (data: { hubIds: string[]; note: string }) => {
    addCarrierRequest(CURRENT_AGENCY_ID, '247Express', data.note, data.hubIds)
    setShowRequestModal(false)
    forceRender(n => n + 1)
  }

  return (
    <>
      {showRequestModal && (
        <RequestHubModal availableHubs={availableHubs} onClose={() => setShowRequestModal(false)} onSubmit={handleSubmitRequest} />
      )}

      {/* Info banner */}
      <div style={{ margin: '12px 16px 0', padding: '12px 16px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0369A1', marginBottom: 4 }}>Về kết nối 247Express</div>
        <div style={{ fontSize: 13, color: '#0C4A6E', lineHeight: 1.6 }}>
          247Express hoạt động ở <strong>cấp độ đại lý</strong> — không cần kết nối từng Shop ID riêng lẻ như GHN.
          Super Admin sẽ phân <strong>một hoặc nhiều địa điểm gửi hàng</strong> cho đại lý.
          Sau khi kích hoạt, tất cả shop của đại lý đều có thể sử dụng 247Express qua các Hub được phân.
        </div>
      </div>

      {/* Hub assignment card */}
      <div style={{ margin: '12px 16px 0', padding: '16px', border: `1px solid ${C_BORDER}`, borderRadius: 8, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>Địa điểm gửi hàng được phân {isActivated && `(${hubs.length})`}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isActivated
              ? <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', fontWeight: 600 }}>Đã kích hoạt</span>
              : <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: '#F9FAFB', color: '#9CA3AF', border: `1px solid ${C_BORDER}` }}>Chưa kích hoạt</span>
            }
            {isActivated && (
              pendingHubRequest ? (
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', fontWeight: 600 }}>Chờ duyệt thêm Hub</span>
              ) : (
                <button
                  onClick={() => setShowRequestModal(true)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C_BORDER}`, background: '#fff', color: '#7C3AED', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  + Yêu cầu thêm địa điểm gửi hàng
                </button>
              )
            )}
          </div>
        </div>

        {/* Yêu cầu gần nhất bị từ chối — nếu không hiện rõ, đại lý chỉ thấy nút yêu cầu quay lại
            bình thường và không biết Super Admin đã phản hồi (và vì sao). */}
        {rejectedHubRequest && (
          <div style={{ marginBottom: 12, padding: '10px 12px', background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 2 }}>
              Yêu cầu {isActivated ? 'cấp thêm địa điểm gửi hàng' : 'kích hoạt 247Express'} đã bị từ chối
            </div>
            {rejectedHubRequest.requestedHubIds && rejectedHubRequest.requestedHubIds.length > 0 && (
              <div style={{ fontSize: 12, color: '#7F1D1D' }}>
                Địa điểm đã yêu cầu: {rejectedHubRequest.requestedHubIds.map(id => clientHubs247.find(h => h.id === id)?.name ?? id).join(', ')}
              </div>
            )}
            <div style={{ fontSize: 12, color: '#7F1D1D' }}>
              Lý do: {rejectedHubRequest.rejectionReason || '(không có lý do cụ thể)'}
            </div>
          </div>
        )}

        {isActivated ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {hubs.map(hub => (
              <div key={hub.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '4px 0', borderTop: `1px solid ${C_BORDER}`, paddingTop: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
                  📦
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#7C3AED' }}>{hub.id}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>{hub.name}</span>
                  <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>📍 {hub.location}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
            Chưa có địa điểm gửi hàng được phân.<br />
            Liên hệ Super Admin để được kích hoạt 247Express.
          </div>
        )}
      </div>

    </>
  )
}

// ─── Tab: Kết nối (GHN) ──────────────────────────────────────────────────────
function TabConnect({ carrier }: { carrier: CarrierKey }) {
  if (carrier === '247Express') return <TabConnect247 />

  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [hovered, setHovered]     = useState<string | null>(null)
  const [, forceRender]           = useState(0)

  const allShops = shopConnections.filter(s => s.agencyId === CURRENT_AGENCY_ID && s.carrier === carrier)
  const activeShops   = allShops.filter(s => s.status === 'active')
  const pendingShops  = allShops.filter(s => s.status === 'pending')
  const rejectedShops = allShops.filter(s => s.status === 'rejected')

  const filtered = allShops.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.shopId.includes(search) || s.phone.includes(search)
  )

  const statusBadge = (status: string, reason?: string) => {
    if (status === 'active')   return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', whiteSpace: 'nowrap' }}>Đang hoạt động</span>
    if (status === 'pending')  return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', whiteSpace: 'nowrap' }}>Chờ GHN duyệt</span>
    if (status === 'rejected') return <span title={reason} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#FFF5F5', color: '#EF4444', border: '1px solid #FCA5A5', whiteSpace: 'nowrap', cursor: reason ? 'help' : 'default' }}>Bị từ chối</span>
    return null
  }

  return (
    <>
      {showModal && <AddShopModal carrier={carrier} onClose={() => setShowModal(false)} onRequestSent={() => forceRender(n => n + 1)} />}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>
            Danh sách Shop ID {carrier} ({activeShops.length} hoạt động
            {pendingShops.length > 0 ? ` · ${pendingShops.length} chờ duyệt` : ''}
            {rejectedShops.length > 0 ? ` · ${rejectedShops.length} bị từ chối` : ''})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6 }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm"
              style={{ border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px', width: 200 }} />
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}>
            <PlusOutlined style={{ color: '#fff', fontSize: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Kết nối</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
          {[
            { label: `Cửa hàng ${carrier}`, flex: '2 0 0',    minWidth: 220 },
            { label: 'Trạng thái',           flex: '0 0 130px', minWidth: 130 },
            { label: 'Gói dịch vụ',          flex: '1 0 0',    minWidth: 120 },
            { label: 'Số điện thoại',         flex: '1 0 0',    minWidth: 130 },
            { label: '',                       flex: '0 0 52px', minWidth: 52  },
          ].map((col, i) => (
            <div key={i} style={{ display: 'flex', flex: col.flex, alignItems: 'center', minWidth: col.minWidth, padding: '6px 8px' }}>
              <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{col.label}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: C_BORDER }} />

        {filtered.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>Không tìm thấy kết quả</div>
        ) : (
          filtered.map((s) => {
            const isPending  = s.status === 'pending'
            const isRejected = s.status === 'rejected'
            const rowBg = isPending ? '#FFFBEB' : isRejected ? '#FFF5F5' : hovered === s.shopId ? '#FAFAFA' : '#fff'
            return (
            <React.Fragment key={s.id}>
              <div
                style={{ display: 'flex', alignItems: 'center', background: rowBg, transition: 'background 0.1s', opacity: isPending || isRejected ? 0.85 : 1 }}
                onMouseEnter={() => !isPending && !isRejected && setHovered(s.shopId)}
                onMouseLeave={() => setHovered(null)}
              >
                <div style={{ flex: '2 0 0', minWidth: 220, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: isRejected ? '#9CA3AF' : C_LINK, lineHeight: '20px' }}>{s.name}</span>
                  <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, fontFamily: 'monospace', lineHeight: '16px' }}>{s.shopId}</span>
                </div>
                <div style={{ flex: '0 0 130px', minWidth: 130, padding: '6px 8px' }}>
                  {statusBadge(s.status, s.rejectionReason)}
                </div>
                <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {s.goiCuoc.length === 0
                    ? <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>
                    : s.goiCuoc.map((gc) => (
                    <span key={gc.id} style={{
                      fontSize: 12, borderRadius: 10, padding: '1px 8px', lineHeight: '18px', whiteSpace: 'nowrap',
                      ...(gc.loai === 'Hàng nhẹ'
                        ? { color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE' }
                        : { color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A' })
                    }}>{gc.loai}</span>
                  ))}
                </div>
                <div style={{ flex: '1 0 0', minWidth: 130, padding: '6px 8px' }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{s.phone}</span>
                </div>
                <div style={{ flex: '0 0 52px', minWidth: 52, padding: '6px 8px' }}>
                  {s.status === 'active' && (
                  <button title="Ngắt kết nối" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: '1px solid #FCA5A5', borderRadius: 6, background: '#FFF5F5', color: '#EF4444', fontSize: 14, cursor: 'pointer' }}>
                    <DisconnectOutlined />
                  </button>
                  )}
                </div>
              </div>
              <div style={{ height: 1, background: C_BORDER }} />
            </React.Fragment>
          )
          })
        )}
      </div>
    </>
  )
}

// ─── Tab: Bảng giá — 247Express ──────────────────────────────────────────────
const ZONE_247_COLORS = [
  { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  { bg: '#FFF7ED', color: '#C2410C', border: '#FDBA74' },
  { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
]

function TabPricing247() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [search, setSearch]   = useState('')

  const agency = agenciesList.find(a => a.id === CURRENT_AGENCY_ID)
  const isActivated = (agency?.clientHubIds ?? []).length > 0

  const filtered = (allPriceTables as any[]).filter(
    (pt) => pt.nvc === '247Express' &&
      (pt.name.toLowerCase().includes(search.toLowerCase()) || (pt.description ?? '').toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <>
      {!isActivated && (
        <div style={{ margin: '8px 16px 0', padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>⚠️</span>
          <span style={{ fontSize: 13, color: '#92400E' }}>
            247Express chưa được kích hoạt. Liên hệ Super Admin để được phân địa điểm gửi hàng trước khi tạo bảng giá.
          </span>
        </div>
      )}

      <div style={{ margin: '8px 16px 0', padding: '10px 14px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8 }}>
        <span style={{ fontSize: 13, color: '#0369A1', lineHeight: 1.5 }}>
          Giá trong bảng là <strong>giá bán cho shop</strong> — đã gồm phần chênh lệch đại lý so với chi phí 247Express báo qua API <code>GetPriceForCustomerAPI</code>.
          Vùng tính theo khoảng cách từ địa điểm gửi hàng → tỉnh/quận/phường nhận hàng.
        </span>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>
          Danh sách bảng giá ({filtered.length})
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6 }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm"
              style={{ border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px', width: 200 }} />
          </div>
          <button
            disabled={!isActivated}
            onClick={() => isActivated && navigate('/agency-admin/carrier-setup/pricing/create-247')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: isActivated ? C_ACTION : '#D1D5DB', border: 'none', borderRadius: 6, cursor: isActivated ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
            <PlusOutlined style={{ color: '#fff', fontSize: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Tạo bảng giá</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
          {[
            { label: 'Tên bảng giá', flex: '2 0 0',    minWidth: 200 },
            { label: 'Ngày tạo',     flex: '0 0 100px', minWidth: 100 },
            { label: 'Vùng giá',     flex: '2 0 0',     minWidth: 240 },
            { label: 'Mô tả',        flex: '2 0 0',     minWidth: 160 },
          ].map((col, i) => (
            <div key={i} style={{ flex: col.flex, minWidth: col.minWidth, padding: '6px 8px' }}>
              <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>{col.label}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: C_BORDER }} />

        {filtered.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>Chưa có bảng giá nào</div>
        ) : filtered.map((pt: any) => {
          const zones: { label: string }[] = pt.zones ?? []
          return (
          <React.Fragment key={pt.id}>
            <div
              style={{ display: 'flex', alignItems: 'center', background: hovered === pt.id ? '#FAFAFA' : '#fff', transition: 'background 0.1s', borderBottom: `1px solid ${C_BORDER}` }}
              onMouseEnter={() => setHovered(pt.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ flex: '2 0 0', minWidth: 200, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                  onClick={() => navigate(`/agency-admin/carrier-setup/pricing/${pt.id}`)}
                  style={{ fontSize: 14, fontWeight: 700, color: C_LINK, cursor: 'pointer' }}
                >{pt.name}</div>
                {pt.isDefault && (
                  <span style={{ display: 'inline-block', fontSize: 11, padding: '1px 6px', borderRadius: 8, background: '#EDE9FE', color: '#7C3AED', border: '1px solid #DDD6FE', alignSelf: 'flex-start' }}>Mặc định</span>
                )}
              </div>
              <div style={{ flex: '0 0 100px', minWidth: 100, padding: '6px 8px' }}>
                <span style={{ fontSize: 13, color: C_TEXT_PRIMARY }}>
                  {pt.createdAt ? pt.createdAt.split('-').reverse().join('/') : '—'}
                </span>
              </div>
              <div style={{ flex: '2 0 0', minWidth: 240, padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {zones.map((z, i) => {
                  const c = ZONE_247_COLORS[i % ZONE_247_COLORS.length]
                  return (
                    <span key={i} style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap',
                      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                    }}>{z.label}</span>
                  )
                })}
              </div>
              <div style={{ flex: '2 0 0', minWidth: 160, padding: '6px 8px', overflow: 'hidden' }}>
                <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pt.description || ''}
                </span>
              </div>
            </div>
          </React.Fragment>
          )
        })}
      </div>
    </>
  )
}

// ─── Tab: Bảng giá (GHN) ─────────────────────────────────────────────────────
function TabPricing({ carrier }: { carrier: CarrierKey }) {
  if (carrier === '247Express') return <TabPricing247 />

  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [search, setSearch]   = useState('')

  const hasActiveShops = shopConnections.some(
    s => s.agencyId === CURRENT_AGENCY_ID && s.carrier === carrier && s.status === 'active'
  )

  const filtered = (allPriceTables as any[]).filter(
    (pt) => pt.nvc === carrier &&
      (pt.name.toLowerCase().includes(search.toLowerCase()) || (pt.description ?? '').toLowerCase().includes(search.toLowerCase()))
  )

  const cols = [
    { label: 'Tên bảng giá', flex: '2 0 0', minWidth: 200 },
    { label: 'Ngày tạo',     flex: '1 0 0', minWidth: 110 },
    { label: 'Mô tả',        flex: '3 0 0', minWidth: 180 },
  ]

  return (
    <>
      {!hasActiveShops && (
        <div style={{ margin: '8px 16px 0', padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>⚠️</span>
          <span style={{ fontSize: 13, color: '#92400E' }}>
            Chưa có Shop ID {carrier} nào được duyệt. Vui lòng{' '}
            <span
              onClick={() => navigate('/agency-admin/carrier-setup/connect')}
              style={{ fontWeight: 600, color: '#D97706', cursor: 'pointer', textDecoration: 'underline' }}
            >
              kết nối Shop ID
            </span>
            {' '}trước khi tạo bảng giá.
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>
          Danh sách bảng giá ({filtered.length})
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6 }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm"
              style={{ border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px', width: 200 }} />
          </div>
          <button
            disabled={!hasActiveShops}
            onClick={() => hasActiveShops && navigate('/agency-admin/carrier-setup/pricing/create')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: hasActiveShops ? C_ACTION : '#D1D5DB', border: 'none', borderRadius: 6, cursor: hasActiveShops ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
            <PlusOutlined style={{ color: '#fff', fontSize: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Tạo bảng giá</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
          {cols.map((col, i) => (
            <div key={i} style={{ display: 'flex', flex: col.flex, alignItems: 'center', minWidth: col.minWidth, padding: '6px 8px' }}>
              <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{col.label}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: C_BORDER }} />

        {filtered.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>Không tìm thấy kết quả</div>
        ) : filtered.map((pt: any) => (
          <React.Fragment key={pt.id}>
            <div
              style={{ display: 'flex', alignItems: 'center', background: hovered === pt.id ? '#FAFAFA' : '#fff', transition: 'background 0.1s', borderBottom: `1px solid ${C_BORDER}` }}
              onMouseEnter={() => setHovered(pt.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ flex: '2 0 0', minWidth: 200, padding: '6px 8px' }}>
                <div
                  onClick={() => navigate(`/agency-admin/carrier-setup/pricing/${pt.id}`)}
                  style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px', cursor: 'pointer' }}
                >{pt.name}</div>
              </div>
              <div style={{ flex: '1 0 0', minWidth: 110, padding: '6px 8px' }}>
                <span style={{ fontSize: 13, color: C_TEXT_PRIMARY }}>
                  {pt.createdAt ? pt.createdAt.split('-').reverse().join('/') : '—'}
                </span>
              </div>
              <div style={{ flex: '3 0 0', minWidth: 180, padding: '6px 8px', overflow: 'hidden' }}>
                <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pt.description || ''}
                </span>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </>
  )
}

// ─── Carrier Request Modal ────────────────────────────────────────────────────
function CarrierRequestModal({ carrier, onClose, onSubmit }: {
  carrier: typeof CARRIERS[number]
  onClose: () => void
  onSubmit: (note: string) => void
}) {
  const [note, setNote] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 480, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C_BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: carrier.color, display: 'inline-block' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: C_TEXT_PRIMARY }}>Yêu cầu kết nối {carrier.label}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C_TEXT_SECONDARY, fontSize: 18, lineHeight: 1 }}>
            <CloseOutlined />
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Info box */}
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0369A1' }}>Về {carrier.label}</div>
            <div style={{ fontSize: 13, color: '#0C4A6E', lineHeight: 1.5 }}>{carrier.fullName} — mạng lưới giao hàng liên tỉnh nhanh, tích hợp đối soát tự động. Sau khi được duyệt, bạn có thể thêm Shop ID và tạo dịch vụ.</div>
          </div>
          {/* Note field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_LABEL }}>Ghi chú (tùy chọn)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Nêu lý do hoặc nhu cầu kết nối với nhà vận chuyển này..."
              rows={3}
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C_BORDER}`, borderRadius: 8, fontSize: 13, color: C_TEXT_PRIMARY, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: `1px solid ${C_BORDER}`, background: '#FAFAFA' }}>
          <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 6, border: `1px solid ${C_BORDER}`, background: '#fff', fontSize: 13, color: C_TEXT_SECONDARY, cursor: 'pointer', fontWeight: 500 }}>
            Huỷ
          </button>
          <button onClick={() => onSubmit(note)} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: C_ACTION, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Carrier selector — embedded inside each section tab ─────────────────────
function CarrierSelector({ selectedCarrier, onSelect, allowedCarriers, onRequestCarrier }: {
  selectedCarrier: CarrierKey
  onSelect: (c: CarrierKey) => void
  allowedCarriers: string[]
  onRequestCarrier: (c: typeof CARRIERS[number]) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 8px', flexShrink: 0 }}>
      <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, marginRight: 4 }}>Nhà vận chuyển:</span>
      {CARRIERS.map((c) => {
        const active = selectedCarrier === c.key
        const enabled = allowedCarriers.includes(c.key)
        const pendingReq = !enabled && carrierRequests.find(
          r => r.agencyId === CURRENT_AGENCY_ID && r.carrier === c.key && r.status === 'pending'
        )
        return (
          <button
            key={c.key}
            onClick={() => {
              if (enabled) onSelect(c.key)
              else if (!pendingReq) onRequestCarrier(c)
            }}
            title={pendingReq ? 'Đang chờ Super Admin duyệt' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s',
              cursor: enabled ? 'pointer' : (pendingReq ? 'default' : 'pointer'),
              border: enabled
                ? (active ? `1.5px solid ${c.color}` : `1.5px solid ${C_BORDER}`)
                : (pendingReq ? '1.5px solid #FCD34D' : `1.5px dashed ${C_BORDER}`),
              background: enabled ? (active ? `${c.color}12` : '#fff') : (pendingReq ? '#FFFBEB' : '#F9FAFB'),
              color: enabled ? (active ? c.color : C_TEXT_SECONDARY) : (pendingReq ? '#D97706' : '#9CA3AF'),
            }}
          >
            {enabled ? (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? c.color : '#D1D5DB', flexShrink: 0 }} />
            ) : pendingReq ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="5" cy="5" r="4" stroke="#D97706" strokeWidth="1.2"/>
                <path d="M5 3v2.2l1.3 1.3" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            ) : (
              <PlusOutlined style={{ fontSize: 10 }} />
            )}
            {c.label}
            {pendingReq && <span style={{ fontSize: 10, background: '#FEF3C7', color: '#D97706', borderRadius: 8, padding: '1px 6px', fontWeight: 700 }}>Chờ duyệt</span>}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CarrierSetup() {
  const { tab } = useParams<{ tab?: string }>()
  const navigate = useNavigate()
  const activeTab: Tab = (tab === 'services' || tab === 'pricing') ? tab : 'connect'
  const setActiveTab = (t: Tab) => navigate(`/agency-admin/carrier-setup/${t}`, { replace: true })

  const agency = agenciesList.find(a => a.id === CURRENT_AGENCY_ID)
  const allowedCarriers = agency?.allowedCarriers ?? ['GHN']

  const [selectedCarrier, setSelectedCarrier] = useState<CarrierKey>('GHN')
  const [requestModalCarrier, setRequestModalCarrier] = useState<typeof CARRIERS[number] | null>(null)
  const [, forceRender] = useState(0)

  const handleSubmitCarrierRequest = (note: string) => {
    if (!requestModalCarrier) return
    addCarrierRequest(CURRENT_AGENCY_ID, requestModalCarrier.key, note)
    setRequestModalCarrier(null)
    forceRender(n => n + 1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>

      {requestModalCarrier && (
        <CarrierRequestModal
          carrier={requestModalCarrier}
          onClose={() => setRequestModalCarrier(null)}
          onSubmit={handleSubmitCarrierRequest}
        />
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
            Thiết lập nhà vận chuyển
          </h1>
          <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
            Kết nối và cấu hình các nhà vận chuyển cho đại lý
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C_BORDER}`, padding: '0 16px', flexShrink: 0 }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <div key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 14, fontWeight: 600, color: isActive ? C_ACTION : C_TEXT_SECONDARY, cursor: 'pointer', borderBottom: isActive ? `2px solid ${C_ACTION}` : '2px solid transparent', marginBottom: -1, userSelect: 'none' as const, transition: 'color 0.15s' }}>
              <span style={{ fontSize: 15 }}>{tab.icon}</span>
              {tab.label}
            </div>
          )
        })}
      </div>

      {/* Tab content — scrollable. Each tab embeds its own carrier selector */}
      <div style={{ flex: '1 0 0', overflowY: 'auto' }}>
        {activeTab === 'connect' && (
          <>
            <CarrierSelector selectedCarrier={selectedCarrier} onSelect={setSelectedCarrier} allowedCarriers={allowedCarriers} onRequestCarrier={setRequestModalCarrier} />
            <TabConnect carrier={selectedCarrier} />
          </>
        )}
        {activeTab === 'services' && (
          <>
            <CarrierSelector selectedCarrier={selectedCarrier} onSelect={setSelectedCarrier} allowedCarriers={allowedCarriers} onRequestCarrier={setRequestModalCarrier} />
            <AgencyServices carrier={selectedCarrier} />
          </>
        )}
        {activeTab === 'pricing' && (
          <>
            <CarrierSelector selectedCarrier={selectedCarrier} onSelect={setSelectedCarrier} allowedCarriers={allowedCarriers} onRequestCarrier={setRequestModalCarrier} />
            <TabPricing carrier={selectedCarrier} />
          </>
        )}
      </div>
    </div>
  )
}
