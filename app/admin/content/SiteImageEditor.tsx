'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/img'
import { SITE_IMAGE_FIELDS } from '@/lib/siteText'
import { updateSiteTexts } from '../actions'

export default function SiteImageEditor({ initial }: { initial: Record<string, string> }) {
  const router = useRouter()
  const [vals, setVals] = useState<Record<string, string>>(initial)
  const [busyKey, setBusyKey] = useState('')
  const [msg, setMsg] = useState('')
  const supabase = createClient()

  async function upload(key: string, file: File) {
    setMsg('')
    if (!file.type.startsWith('image/')) return setMsg('❌ 이미지 파일만 올릴 수 있어요.')
    if (file.size > 8 * 1024 * 1024) return setMsg('❌ 사진 용량은 8MB 이하여야 해요.')
    setBusyKey(key)
    const uploadFile = await compressImage(file)
    const ext = uploadFile.name.split('.').pop() || 'jpg'
    const path = `guide/${key.replace(/[^a-zA-Z0-9]+/g, '_')}_${Date.now()}.${ext}`
    // 파일명이 매번 유니크 → 내용 불변이므로 길게(1년) 캐시. 재열람 시 전송량 절감.
    const { error } = await supabase.storage
      .from('landing-images')
      .upload(path, uploadFile, { cacheControl: '31536000' })
    if (error) {
      setBusyKey('')
      return setMsg('❌ 업로드 실패: ' + error.message)
    }
    const { data } = supabase.storage.from('landing-images').getPublicUrl(path)
    const res = await updateSiteTexts([{ key, value: data.publicUrl }])
    setBusyKey('')
    if ('error' in res) return setMsg('❌ ' + res.error)
    setVals((v) => ({ ...v, [key]: data.publicUrl }))
    setMsg('✅ 이미지가 저장되었습니다.')
    router.refresh()
  }

  async function remove(key: string) {
    const res = await updateSiteTexts([{ key, value: '' }])
    if ('error' in res) return alert(res.error)
    setVals((v) => ({ ...v, [key]: '' }))
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {SITE_IMAGE_FIELDS.map((f) => (
        <div key={f.key} className="rounded-xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-medium text-gray-700">{f.label}</p>
          <div className="flex items-center gap-3">
            {vals[f.key] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vals[f.key]} alt="" className="h-24 w-24 rounded-lg border border-gray-200 object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400">
                없음
              </div>
            )}
            <div className="flex flex-col items-start gap-2">
              <label className="cursor-pointer rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700">
                {busyKey === f.key ? '올리는 중…' : '이미지 올리기'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busyKey === f.key}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) upload(f.key, file)
                    e.target.value = ''
                  }}
                />
              </label>
              {vals[f.key] && (
                <button onClick={() => remove(f.key)} className="text-xs text-red-500 hover:underline">
                  삭제
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </div>
  )
}
