import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-green-50 px-4 text-center">
      <div className="text-5xl">🔍</div>
      <h1 className="mt-4 text-xl font-bold text-gray-800">페이지를 찾을 수 없어요</h1>
      <p className="mt-2 text-sm text-gray-500">주소가 바뀌었거나 없는 페이지예요.</p>
      <Link href="/" className="mt-6 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
        홈으로
      </Link>
    </main>
  )
}
