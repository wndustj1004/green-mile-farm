// 페이지 데이터를 불러오는 동안 보여주는 로딩 화면
export default function PageLoading({ label = '불러오는 중...' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-gray-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
