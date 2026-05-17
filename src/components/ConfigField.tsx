import { Eye, EyeOff } from 'lucide-react'

type ConfigFieldProps = {
  label: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'password' | 'number'
  multiline?: boolean
  maskToggle?: {
    shown: boolean
    onToggle: () => void
  }
}

export function ConfigField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline = false,
  maskToggle,
}: ConfigFieldProps) {
  const inputType = type === 'password' && maskToggle?.shown ? 'text' : type

  return (
    <label className="config-field">
      <span className="field-label">{label}</span>
      <div className="field-shell">
        {multiline ? (
          <textarea
            value={String(value)}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            rows={3}
          />
        ) : (
          <input
            value={String(value)}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            type={inputType}
            autoComplete="off"
          />
        )}
        {maskToggle ? (
          <button
            type="button"
            className="ghost-icon-btn"
            onClick={maskToggle.onToggle}
            aria-label={maskToggle.shown ? '隐藏 API Key' : '显示 API Key'}
          >
            {maskToggle.shown ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : null}
      </div>
    </label>
  )
}
