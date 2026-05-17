import { Copy, Sparkles } from 'lucide-react'
import { useMemo } from 'react'

type ResultSectionProps = {
  title: string
  subtitle: string
  value: unknown
  rawText?: string | null
  onCopy?: () => void
}

export function ResultSection({ title, subtitle, value, rawText, onCopy }: ResultSectionProps) {
  const preview = useMemo(() => {
    if (!value) {
      return '等待生成'
    }
    return JSON.stringify(value, null, 2)
  }, [value])

  return (
    <section className="panel-card result-card">
      <div className="section-head">
        <div>
          <p className="eyebrow">{title}</p>
          <p className="section-hint">{subtitle}</p>
        </div>
        {onCopy ? (
          <button type="button" className="ghost-pill" onClick={onCopy}>
            <Copy size={14} />
            复制
          </button>
        ) : null}
      </div>

      <div className="result-preview">
        {value ? <Sparkles size={16} /> : null}
        <pre>{preview}</pre>
      </div>

      {rawText ? (
        <details className="raw-details">
          <summary>查看原始响应</summary>
          <pre>{rawText}</pre>
        </details>
      ) : null}
    </section>
  )
}
