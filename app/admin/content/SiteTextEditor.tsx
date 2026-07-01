'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SITE_TEXT_FIELDS } from '@/lib/siteText'
import { updateSiteTexts } from '../actions'

export default function SiteTextEditor({ initial }: { initial: Record<string, string> }) {
  const router = useRouter()
  const [vals, setVals] = useState<Record<string, string>>(initial)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const groups = Array.from(new Set(SITE_TEXT_FIELDS.map((f) => f.group)))
  const input =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none'

  function set(key: string, value: string) {
    setVals((v) => ({ ...v, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setMsg('')
    const entries = SITE_TEXT_FIELDS.map((f) => ({ key: f.key, value: vals[f.key] ?? f.def }))
    const res = await updateSiteTexts(entries)
    setSaving(false)
    setMsg('error' in res ? '❌ ' + res.error : '✅ 저장되었습니다.')
    if (!('error' in res)) router.refresh()
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g} className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-green-700">{g}</h3>
          <div className="space-y-3">
            {SITE_TEXT_FIELDS.filter((f) => f.group === g).map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs text-gray-500">{f.label}</label>
                {f.multiline ? (
                  <textarea
                    className={`${input} h-20 resize-y leading-relaxed`}
                    value={vals[f.key] ?? ''}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                ) : (
                  <input className={input} value={vals[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="sticky bottom-3 flex items-center gap-3 rounded-xl bg-white/95 p-3 shadow-sm">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '메인페이지 텍스트 저장'}
        </button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </div>
  )
}
