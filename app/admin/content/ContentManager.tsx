'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createSection,
  updateSection,
  deleteSection,
  moveSection,
  type LandingSection,
} from '../actions'

export default function ContentManager({ initial }: { initial: LandingSection[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function add() {
    setBusy(true)
    const res = await createSection()
    setBusy(false)
    if ('error' in res) {
      alert(res.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {initial.length === 0 && (
        <p className="rounded-xl bg-white p-5 text-sm text-gray-400 shadow-sm">
          아직 섹션이 없습니다. 아래 “＋ 섹션 추가”로 만들어보세요.
        </p>
      )}

      {initial.map((s, i) => (
        <SectionRow
          key={s.id}
          section={s}
          isFirst={i === 0}
          isLast={i === initial.length - 1}
          onStructureChange={() => router.refresh()}
        />
      ))}

      <button
        onClick={add}
        disabled={busy}
        className="w-full rounded-xl border-2 border-dashed border-green-300 py-3 text-sm font-semibold text-green-600 hover:bg-green-50 disabled:opacity-50"
      >
        ＋ 섹션 추가
      </button>
    </div>
  )
}

function SectionRow({
  section,
  isFirst,
  isLast,
  onStructureChange,
}: {
  section: LandingSection
  isFirst: boolean
  isLast: boolean
  onStructureChange: () => void
}) {
  const [emoji, setEmoji] = useState(section.emoji)
  const [title, setTitle] = useState(section.title)
  const [body, setBody] = useState(section.body)
  const [visible, setVisible] = useState(section.visible)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const input =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none'

  async function save() {
    setMsg('')
    setSaving(true)
    const res = await updateSection(section.id, { emoji, title, body, visible })
    setSaving(false)
    setMsg('error' in res ? '❌ ' + res.error : '✅ 저장됨')
  }

  async function move(dir: 'up' | 'down') {
    const res = await moveSection(section.id, dir)
    if ('error' in res) {
      alert(res.error)
      return
    }
    onStructureChange()
  }

  async function remove() {
    if (!confirm(`'${section.title}' 섹션을 삭제할까요? 되돌릴 수 없습니다.`)) return
    const res = await deleteSection(section.id)
    if ('error' in res) {
      alert(res.error)
      return
    }
    onStructureChange()
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <input
          aria-label="아이콘"
          className={`${input} w-14 text-center text-lg`}
          value={emoji}
          maxLength={4}
          onChange={(e) => setEmoji(e.target.value)}
        />
        <input
          aria-label="제목"
          className={`${input} min-w-0 flex-1 font-semibold`}
          value={title}
          placeholder="섹션 제목"
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="flex select-none items-center gap-1.5 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="h-4 w-4 accent-green-600"
          />
          화면 표시
        </label>
      </div>

      <textarea
        aria-label="본문"
        className={`${input} mt-3 h-40 w-full resize-y leading-relaxed`}
        value={body}
        placeholder="본문을 입력하세요. 줄바꿈은 그대로 화면에 표시됩니다."
        onChange={(e) => setBody(e.target.value)}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        <button
          onClick={() => move('up')}
          disabled={isFirst}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          title="위로"
        >
          ↑
        </button>
        <button
          onClick={() => move('down')}
          disabled={isLast}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          title="아래로"
        >
          ↓
        </button>
        <button
          onClick={remove}
          className="ml-auto rounded-lg border border-red-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
        >
          삭제
        </button>
        {msg && <span className="w-full text-sm text-gray-600 sm:w-auto">{msg}</span>}
      </div>
    </div>
  )
}
