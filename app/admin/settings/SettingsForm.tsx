'use client'

import { useState } from 'react'
import { updateSettings, type SettingsInput } from '../actions'

export default function SettingsForm({ initial }: { initial: SettingsInput }) {
  const [v, setV] = useState<SettingsInput>(initial)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  function num(key: keyof SettingsInput, val: string) {
    setV((p) => ({ ...p, [key]: val === '' ? 0 : Number(val) }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setSaving(true)
    const res = await updateSettings(v)
    setSaving(false)
    setMsg('error' in res ? '❌ ' + res.error : '✅ 저장되었습니다.')
  }

  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none'
  const label = 'block text-xs text-gray-500 mb-1'

  return (
    <form onSubmit={save} className="max-w-lg space-y-6">
      {/* 목표·일정 */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">챌린지 목표 · 일정</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={label}>목표 감축량 (kg)</label>
            <input type="number" step="0.1" min="0.1" className={input} value={v.targetCo2Kg} onChange={(e) => num('targetCo2Kg', e.target.value)} />
          </div>
          <div>
            <label className={label}>시작일</label>
            <input type="date" className={input} value={v.challengeStart} onChange={(e) => setV((p) => ({ ...p, challengeStart: e.target.value }))} />
          </div>
          <div>
            <label className={label}>종료일</label>
            <input type="date" className={input} value={v.challengeEnd} onChange={(e) => setV((p) => ({ ...p, challengeEnd: e.target.value }))} />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">목표를 바꾸면 모든 사용자의 작물 5단계 구간이 자동 비례 조정됩니다.</p>
      </section>

      {/* 배출계수 */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-gray-700">CO₂ 배출계수 (g/km)</h2>
        <p className="mb-3 text-xs text-amber-600">⚠️ 현재 임시값. 전공팀이 환경부/KATRI 공식값 확정 시 여기서 교체하세요.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div>
            <label className={label}>승용차(기준)</label>
            <input type="number" step="0.01" className={input} value={v.carEmission} onChange={(e) => num('carEmission', e.target.value)} />
          </div>
          <div>
            <label className={label}>걷기</label>
            <input type="number" step="0.01" className={input} value={v.walkEmission} onChange={(e) => num('walkEmission', e.target.value)} />
          </div>
          <div>
            <label className={label}>자전거</label>
            <input type="number" step="0.01" className={input} value={v.bikeEmission} onChange={(e) => num('bikeEmission', e.target.value)} />
          </div>
          <div>
            <label className={label}>버스</label>
            <input type="number" step="0.01" className={input} value={v.busEmission} onChange={(e) => num('busEmission', e.target.value)} />
          </div>
          <div>
            <label className={label}>지하철</label>
            <input type="number" step="0.01" className={input} value={v.subwayEmission} onChange={(e) => num('subwayEmission', e.target.value)} />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">감축량 = (승용차 − 선택 수단) × 거리. 이미 등록된 인증의 값은 바뀌지 않고, 변경 이후 인증부터 적용됩니다.</p>
      </section>

      <div className="flex items-center gap-3">
        <button disabled={saving} className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
          {saving ? '저장 중...' : '저장'}
        </button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </form>
  )
}
