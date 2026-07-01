'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { changeName } from './actions'

export default function NameEditor({ currentName }: { currentName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    setMsg('')
    setSaving(true)
    const res = await changeName(name)
    setSaving(false)
    if ('error' in res) {
      setMsg(res.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => {
          setName(currentName)
          setMsg('')
          setOpen(true)
        }}
        className="text-[11px] font-medium text-gm-muted2 underline decoration-gm-line underline-offset-2 hover:text-gm-muted"
      >
        이름 변경
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-2xl border border-gm-line bg-white p-3">
      <p className="mb-1.5 text-[11px] text-gm-muted2">이름은 10일에 한 번만 바꿀 수 있어요.</p>
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="새 이름"
          className="min-w-0 flex-1 rounded-lg border border-gm-line px-3 py-2 text-sm focus:border-gm-leaf focus:outline-none focus:ring-1 focus:ring-gm-leaf"
        />
        <button
          onClick={save}
          disabled={saving}
          className="shrink-0 rounded-lg bg-gm-green px-3.5 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? '변경 중…' : '변경'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="shrink-0 rounded-lg border border-gm-line px-3 py-2 text-sm text-gm-muted"
        >
          취소
        </button>
      </div>
      {msg && <p className="mt-1.5 text-xs text-red-500">{msg}</p>}
    </div>
  )
}
