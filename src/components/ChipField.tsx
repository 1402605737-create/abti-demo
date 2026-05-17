type ChipFieldProps = {
  label: string
  hint?: string
  options: readonly string[]
  values: string[]
  onToggle: (value: string) => void
}

export function ChipField({ label, hint, options, values, onToggle }: ChipFieldProps) {
  return (
    <section className="panel-card">
      <div className="section-head">
        <div>
          <p className="eyebrow">{label}</p>
          {hint ? <p className="section-hint">{hint}</p> : null}
        </div>
        <span className="tiny-badge">已选 {values.length}</span>
      </div>
      <div className="chip-grid">
        {options.map((option) => {
          const active = values.includes(option)
          return (
            <button
              key={option}
              type="button"
              className={active ? 'choice-chip active' : 'choice-chip'}
              onClick={() => onToggle(option)}
            >
              {option}
            </button>
          )
        })}
      </div>
    </section>
  )
}
