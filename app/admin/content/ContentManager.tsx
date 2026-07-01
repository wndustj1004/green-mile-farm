'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  createSection,
  updateSection,
  updateSectionImages,
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
  const [images, setImages] = useState<string[]>(section.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const input =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none'

  async function uploadImage(file: File) {
    setMsg('')
    if (!file.type.startsWith('image/')) return setMsg('❌ 이미지 파일만 첨부할 수 있어요.')
    if (file.size > 8 * 1024 * 1024) return setMsg('❌ 사진 용량은 8MB 이하여야 해요.')
    setUploading(true)
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${section.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('landing-images').upload(path, file)
    if (error) {
      setUploading(false)
      return setMsg('❌ 업로드 실패: ' + error.message)
    }
    const { data } = supabase.storage.from('landing-images').getPublicUrl(path)
    const next = [...images, data.publicUrl]
    const res = await updateSectionImages(section.id, next)
    setUploading(false)
    if ('error' in res) return setMsg('❌ ' + res.error)
    setImages(next)
    setMsg('✅ 이미지 추가됨')
  }

  async function removeImage(url: string) {
    const next = images.filter((u) => u !== url)
    const res = await updateSectionImages(section.id, next)
    if ('error' in res) return alert(res.error)
    setImages(next)
  }

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

      {/* 이미지 첨부 */}
      <div className="mt-3">
        <p className="mb-1.5 text-xs font-medium text-gray-500">이미지 (여러 장 가능 · 8MB 이하)</p>
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="첨부 이미지" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute right-0 top-0 bg-black/50 px-1.5 text-xs text-white hover:bg-black/70"
                aria-label="이미지 삭제"
              >
                ✕
              </button>
            </div>
          ))}
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 text-center text-xs text-gray-400 hover:bg-gray-50">
            {uploading ? '올리는 중…' : '＋ 이미지'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) uploadImage(f)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>

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
