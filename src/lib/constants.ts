/** Canonical site URL, sourced from env or falling back to the Vercel deployment. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://finance-job-board.vercel.app'

/** Contact email displayed across the site. */
export const CONTACT_EMAIL = 'luke.schindler@me.com'

/** Finance job categories used across the site. */
export const JOB_CATEGORIES = [
  'Investment Banking',
  'Accounting',
  'Sales & Trading',
  'Corporate Finance',
  'Consulting',
  'Private Wealth',
  'Research',
  'Risk Management',
  'Private Equity',
] as const

/** Color mapping for job categories (Tailwind classes). */
export const CATEGORY_COLORS: Record<string, string> = {
  'Investment Banking': 'bg-blue-50 text-blue-700 border-blue-200',
  'Private Wealth': 'bg-purple-50 text-purple-700 border-purple-200',
  'Accounting': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Sales & Trading': 'bg-red-50 text-red-700 border-red-200',
  'Corporate Finance': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Consulting': 'bg-teal-50 text-teal-700 border-teal-200',
  'Research': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Risk Management': 'bg-orange-50 text-orange-700 border-orange-200',
  'Private Equity': 'bg-violet-50 text-violet-700 border-violet-200',
  'Commercial Banking': 'bg-sky-50 text-sky-700 border-sky-200',
}
