import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SITE_URL } from '@/lib/constants'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams
  const query = q?.trim() || ''

  if (!query) {
    return {
      title: 'Search Finance Jobs | Entry Level Finance Jobs',
      description: 'Search entry-level finance and accounting job listings. Find positions in Investment Banking, Accounting, Private Equity, and more.',
      alternates: { canonical: `${SITE_URL}/search` },
    }
  }

  return {
    title: `"${query}" Jobs | Entry Level Finance Jobs`,
    description: `Search results for "${query}" in entry-level finance positions. Browse matching jobs from top financial institutions.`,
    alternates: { canonical: `${SITE_URL}/search?q=${encodeURIComponent(query)}` },
    robots: { index: false, follow: true }, // Don't index search result pages
  }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const query = q?.trim() || ''

  // Redirect to home page with search param to reuse existing infrastructure
  redirect(query ? `/?search=${encodeURIComponent(query)}` : '/')
}
