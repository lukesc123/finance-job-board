'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    // Token exists, user is authenticated
    setIsAuthenticated(true)
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-300 border-t-navy-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy-900">Admin Dashboard</h1>
            <p className="mt-2 text-navy-600">Manage job listings and board content</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('admin_token')
              router.push('/admin/login')
            }}
            className="rounded-lg bg-navy-100 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-200 transition"
          >
            Sign Out
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder Cards */}
          <div className="rounded-lg border border-navy-200 bg-white p-6">
            <h3 className="font-semibold text-navy-900 mb-2">Jobs</h3>
            <p className="text-sm text-navy-600">Manage and verify job listings</p>
            <a
              href="#jobs"
              className="mt-4 inline-block text-sm font-medium text-navy-700 hover:text-navy-900"
            >
              View →
            </a>
          </div>

          <div className="rounded-lg border border-navy-200 bg-white p-6">
            <h3 className="font-semibold text-navy-900 mb-2">Companies</h3>
            <p className="text-sm text-navy-600">Manage company profiles</p>
            <a
              href="#companies"
              className="mt-4 inline-block text-sm font-medium text-navy-700 hover:text-navy-900"
            >
              View →
            </a>
          </div>

          <div className="rounded-lg border border-navy-200 bg-white p-6">
            <h3 className="font-semibold text-navy-900 mb-2">Analytics</h3>
            <p className="text-sm text-navy-600">View board statistics</p>
            <a
              href="#analytics"
              className="mt-4 inline-block text-sm font-medium text-navy-700 hover:text-navy-900"
            >
              View →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
