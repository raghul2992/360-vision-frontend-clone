import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createTenant } from '../features/admin/adminSlice'
import { toast } from 'react-toastify'
import { colors, gradients, shadows, iconSizes } from '../theme'
import { CloseIcon, ArrowRightIcon, EyeIcon, EyeOffIcon } from '../icons'

const Field = ({ label, required, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{ fontSize: '13.5px', fontWeight: 700, color: colors.text }}>
      {label}
      {required && <span style={{ color: colors.danger, marginLeft: '2px' }}>*</span>}
    </label>
    {children}
  </div>
)

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '13.5px',
  borderRadius: '10px',
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  color: colors.text,
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'inherit',
}

const InputField = ({ type = 'text', placeholder, value, onChange, rightSlot, name, autoComplete }) => {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          ...inputStyle,
          paddingRight: rightSlot ? '40px' : '14px',
          borderColor: focused ? colors.accent : colors.border,
          boxShadow: focused ? shadows.focusRing : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightSlot && (
        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMute, display: 'flex', alignItems: 'center' }}>
          {rightSlot}
        </span>
      )}
    </div>
  )
}

const AddTenantModal = ({ onClose, onSuccess }) => {
  const dispatch = useDispatch()
  const { updateLoading } = useSelector(state => state.admin)

  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    // Blur any focused page element so the search bar stops receiving keystrokes
    document.activeElement?.blur()
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleChange = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    const { companyName, address, fullName, email, password, confirmPassword } = formData

    if (!companyName || !address || !fullName || !email || !password || !confirmPassword) {
      toast.error('All fields are required')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      await dispatch(
        createTenant({
          name: companyName,
          address,
          admin_user: {
            full_name: fullName,
            email,
            role: 'admin',
            meta: { assign_locations: [] },
            password,
          },
        })
      ).unwrap()

      toast.success('Tenant created successfully')
      onSuccess?.()
      onClose()
    } catch (error) {
      toast.error(error || 'Failed to create tenant')
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: colors.overlay, backdropFilter: 'blur(6px)',
      }}
      onKeyDown={e => e.stopPropagation()}
    >
      <div
        style={{
          background: colors.panel,
          border: `1px solid ${colors.border}`,
          borderRadius: '20px',
          width: '100%',
          maxWidth: '480px',
          margin: '0 16px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: shadows.modal,
          scrollbarWidth: 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: colors.text, margin: 0 }}>
            Add New Tenant
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              background: colors.bg,
              color: colors.textDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = colors.dangerSubtle; e.currentTarget.style.color = colors.dangerDark; e.currentTarget.style.borderColor = colors.dangerBorder; }}
            onMouseLeave={e => { e.currentTarget.style.background = colors.bg; e.currentTarget.style.color = colors.textDim; e.currentTarget.style.borderColor = colors.border; }}
          >
            <CloseIcon size={iconSizes.button} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Organisation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: colors.accentDark, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Organisation
            </span>
            <div style={{ flex: 1, height: '1px', background: colors.border }} />
          </div>

          <Field label="Company Name" required>
            <InputField
              name="organization"
              autoComplete="organization"
              placeholder="Enter company name"
              value={formData.companyName}
              onChange={e => handleChange('companyName', e.target.value)}
            />
          </Field>

          <Field label="Address" required>
            <InputField
              name="street-address"
              autoComplete="street-address"
              placeholder="Enter address"
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
            />
          </Field>

          {/* Admin User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: colors.accentDark, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Admin User
            </span>
            <div style={{ flex: 1, height: '1px', background: colors.border }} />
          </div>

          <Field label="Full Name" required>
            <InputField
              name="name"
              autoComplete="name"
              placeholder="Enter full name"
              value={formData.fullName}
              onChange={e => handleChange('fullName', e.target.value)}
            />
          </Field>

          <Field label="Email Address" required>
            <InputField
              type="email"
              name="email"
              autoComplete="email"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
            />
          </Field>

          <Field label="Password" required>
            <InputField
              type={showPassword ? 'text' : 'password'}
              name="new-password"
              autoComplete="new-password"
              placeholder="Enter password"
              value={formData.password}
              onChange={e => handleChange('password', e.target.value)}
              rightSlot={
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}>
                  {showPassword ? <EyeOffIcon size={iconSizes.action} /> : <EyeIcon size={iconSizes.action} />}
                </button>
              }
            />
          </Field>

          <Field label="Confirm Password" required>
            <InputField
              type={showConfirm ? 'text' : 'password'}
              name="confirm-password"
              autoComplete="new-password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={e => handleChange('confirmPassword', e.target.value)}
              rightSlot={
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}>
                  {showConfirm ? <EyeOffIcon size={iconSizes.action} /> : <EyeIcon size={iconSizes.action} />}
                </button>
              }
            />
          </Field>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex', gap: '12px',
            padding: '16px 24px',
            borderTop: `1px solid ${colors.border}`,
            background: colors.bg,
            borderRadius: '0 0 20px 20px',
          }}
        >
          <button
            onClick={onClose}
            disabled={updateLoading}
            style={{
              flex: 1, padding: '10px 0', borderRadius: '10px',
              border: `1px solid ${colors.border}`,
              background: colors.panel,
              color: colors.textDim,
              fontSize: '13.5px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = colors.bg2; }}
            onMouseLeave={e => { e.currentTarget.style.background = colors.panel; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateLoading}
            style={{
              flex: 1, padding: '10px 0', borderRadius: '10px',
              border: 'none',
              background: gradients.accent,
              boxShadow: updateLoading ? 'none' : shadows.button,
              opacity: updateLoading ? 0.55 : 1,
              color: colors.panel,
              fontSize: '13.5px', fontWeight: 600,
              cursor: updateLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.15s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!updateLoading) e.currentTarget.style.boxShadow = shadows.buttonHover; }}
            onMouseLeave={e => { if (!updateLoading) e.currentTarget.style.boxShadow = shadows.button; }}
          >
            {updateLoading ? 'Creating...' : 'Create Tenant'}
            {!updateLoading && <ArrowRightIcon size={iconSizes.info} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddTenantModal
