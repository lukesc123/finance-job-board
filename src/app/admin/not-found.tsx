import Link from 'next/link'

export default function AdminNotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-navy-900 mb-2">Page not found</h1>
        <p className="text-sm text-navy-600 mb-6">The admin page you're looking for doesn't exist.</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/admin"
            className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
          >
            Admin Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
