interface BaseInputProps {
  value: string
  onInput?: (val: string) => void
  class?: string
  placeholder?: string
  autocomplete?: 'off' | undefined
}

export function TextInput({ value, onInput, class: extraClass, placeholder, autocomplete }: BaseInputProps) {
  return (
    <input
      type="text"
      value={value}
      onInput={e => onInput?.((e.target as HTMLInputElement).value)}
      class={`text-input${extraClass ? ' ' + extraClass : ''}`}
      placeholder={placeholder}
      autocomplete={autocomplete}
    />
  )
}

export function NumberInput({ value, min, step, onInput, class: extraClass }: BaseInputProps & { min?: string; step?: string }) {
  return (
    <input
      type="number"
      value={value}
      onInput={e => onInput?.((e.target as HTMLInputElement).value)}
      class={`number-input${extraClass ? ' ' + extraClass : ''}`}
      min={min}
      step={step}
    />
  )
}

export function Select({ value, onChange, options }: {
  value: string
  onChange?: (val: string) => void
  options: { label: string; value: string }[]
}) {
  return (
    <select value={value} onChange={e => onChange?.((e.target as HTMLSelectElement).value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function CheckboxLabel({ label, checked, onChange }: {
  label: string
  checked: boolean
  onChange?: (checked: boolean) => void
}) {
  return (
    <label>
      <input
        type="checkbox"
        value={label}
        checked={checked}
        onChange={e => onChange?.((e.target as HTMLInputElement).checked)}
      />
      {label}
    </label>
  )
}

export function FieldGroup({ label, children, id }: { label: string; children?: preact.ComponentChildren; id?: string }) {
  return (
    <div class="field-group">
      <label for={id}>{label}</label>
      {children}
    </div>
  )
}

export function FormRow({ children }: { children?: preact.ComponentChildren }) {
  return <div class="form-row">{children}</div>
}
