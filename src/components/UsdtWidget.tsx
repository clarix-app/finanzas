import { useState, useEffect } from 'react'
import { DollarSign, Pencil, Check, X } from 'lucide-react'

interface Props {
  amount: number
  saving: boolean
  onSave: (v: number) => void
  label?: string
}

export default function UsdtWidget({ amount, saving, onSave, label = 'USDT Comprado' }: Props) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')

  useEffect(() => {
    if (editing) setInput(String(amount || ''))
  }, [editing, amount])

  const handleSave = () => {
    const val = parseFloat(input)
    if (!isNaN(val) && val >= 0) onSave(val)
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-5 py-3">
      <div className="flex items-center gap-3">
        <DollarSign className="w-4 h-4 text-yellow-400 shrink-0" />
        <span className="text-sm font-semibold text-yellow-300">{label}</span>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
              className="w-28 bg-background border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:border-yellow-400"
              autoFocus
            />
            <button onClick={handleSave} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
            <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-yellow-200 font-bold text-base">${amount.toFixed(2)}</span>
            <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-yellow-300 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      {saving && <span className="text-xs text-muted-foreground">Guardando...</span>}
    </div>
  )
}
