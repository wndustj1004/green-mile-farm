// Supabase Storage 공개 이미지 URL을 표시용 '자동 축소(transform)' URL로 바꾼다.
// 원본 파일은 그대로 두고, 화면에는 지정 폭으로 리사이즈·품질조정된 버전을 요청해
// 전송량(egress)과 로딩 속도를 줄인다. (Supabase Pro의 Image Transformation 기능 사용)
// Supabase 공개 URL이 아니면(외부 URL 등) 원본을 그대로 반환한다.
// object-cover로 잘라 보여주는 영역은 height+resize:'cover'를 함께 주면
// 서버에서 표시 비율로 잘라 내려받아 용량이 크게 준다(극단적으로 긴 사진에 특히 효과).
// object-contain으로 전체를 보여주는 경우엔 width만 주면 된다.
export function supaImg(
  url: string | null | undefined,
  opts: { width: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' } = {
    width: 800,
  }
): string {
  if (!url) return url ?? ''
  const marker = '/storage/v1/object/public/'
  if (!url.includes(marker)) return url
  const base = url.replace(marker, '/storage/v1/render/image/public/')
  const sep = base.includes('?') ? '&' : '?'
  const params = new URLSearchParams({
    width: String(opts.width),
    quality: String(opts.quality ?? 75),
  })
  if (opts.height) params.set('height', String(opts.height))
  if (opts.resize) params.set('resize', opts.resize)
  return `${base}${sep}${params.toString()}`
}

// 브라우저에서 업로드 '전에' 이미지를 리사이즈·재압축한다(저장 용량·전송량 절감).
// - 방향(Orientation)은 imageOrientation:'from-image'로 보존해 눕는 문제 방지.
// - EXIF는 호출 전에 이미 추출·저장되므로 여기서 스트립돼도 무방.
// - 어떤 이유로든 실패하거나 원본보다 커지면 '원본 File'을 그대로 반환한다(제출 안전).
export async function compressImage(
  file: File,
  opts: { maxEdge?: number; quality?: number } = {}
): Promise<File> {
  const maxEdge = opts.maxEdge ?? 1600
  const quality = opts.quality ?? 0.82
  if (typeof window === 'undefined' || typeof createImageBitmap === 'undefined') return file
  if (!file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    )
    if (!blob || blob.size >= file.size) return file
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
  } catch {
    return file
  }
}
