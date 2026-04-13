import React, { useState, useRef, useEffect } from 'react'

const CORRECT_PIN = '240602'
const PIN_LENGTH  = 6
const SESSION_KEY = 'ghn_pin_unlocked'

const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_BORDER         = '#E5E7EB'
const C_ACTION         = '#FF5200'
const C_BG             = '#F9FAFB'

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [pin, setPin]     = useState<string[]>(Array(PIN_LENGTH).fill(''))
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(PIN_LENGTH).fill(null))

  useEffect(() => {
    if (!unlocked) setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }, [unlocked])

  if (unlocked) return <>{children}</>

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next  = [...pin]
    next[index] = digit
    setPin(next)
    setError(false)

    if (digit && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when last digit filled
    if (digit && index === PIN_LENGTH - 1) {
      const entered = next.join('')
      if (entered === CORRECT_PIN) {
        sessionStorage.setItem(SESSION_KEY, '1')
        setUnlocked(true)
      } else {
        setError(true)
        setShake(true)
        setTimeout(() => {
          setShake(false)
          setPin(Array(PIN_LENGTH).fill(''))
          inputRefs.current[0]?.focus()
        }, 600)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 16, padding: '48px 56px', width: 420, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.07), 0 8px 10px -3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 44, background: C_ACTION, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>G</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C_TEXT_PRIMARY, letterSpacing: 0.3 }}>GHN Agency Prototype</div>
            <div style={{ fontSize: 14, color: C_TEXT_SECONDARY, marginTop: 4 }}>Nhập mã PIN để tiếp tục</div>
          </div>
        </div>

        {/* PIN boxes */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            animation: shake ? 'pinShake 0.5s ease' : 'none',
          }}
        >
          <style>{`
            @keyframes pinShake {
              0%,100% { transform: translateX(0); }
              15%      { transform: translateX(-6px); }
              35%      { transform: translateX(6px); }
              55%      { transform: translateX(-4px); }
              75%      { transform: translateX(4px); }
            }
          `}</style>
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              maxLength={1}
              inputMode="numeric"
              type="password"
              style={{
                width: 52,
                height: 60,
                border: `2px solid ${error ? '#EF4444' : digit ? C_ACTION : C_BORDER}`,
                borderRadius: 10,
                textAlign: 'center',
                fontSize: 22,
                fontWeight: 700,
                color: C_TEXT_PRIMARY,
                outline: 'none',
                boxSizing: 'border-box',
                background: digit ? '#FFF4ED' : '#fff',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = '#FFA274' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#EF4444' : digit ? C_ACTION : C_BORDER }}
            />
          ))}
        </div>

        {/* Error message */}
        <div style={{ height: 20, display: 'flex', alignItems: 'center', marginTop: -24 }}>
          {error && (
            <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 500 }}>
              Mã PIN không đúng. Vui lòng thử lại.
            </span>
          )}
        </div>

        <div style={{ fontSize: 12, color: C_TEXT_LABEL, marginTop: -16 }}>
          Nhập đủ {PIN_LENGTH} chữ số để xác nhận tự động
        </div>
      </div>
    </div>
  )
}
