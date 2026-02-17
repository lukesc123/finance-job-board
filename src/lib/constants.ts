/** Canonical site URL, sourced from env or falling back to the Vercel deployment. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://finance-job-board.vercel.app'

/** Contact email displayed across the site. */
export const CONTACT_EMAIL = 'luke.schindler@me.com'

/** Finance job categories used across the site, ordered by job count. */
export const JOB_CATEGORIES = [
  'Investment Banking',
  'Research',
  'Financial Planning',
  'Private Wealth',
  'Operations',
  'Sales & Trading',
  'Accounting',
  'Insurance',
  'Risk Management',
  'Commercial Banking',
  'Consulting',
  'Corporate Finance',
  'Private Equity',
  'Venture Capital',
] as const

/** Salary filter minimum threshold options. */
export const SALARY_MIN_OPTIONS = [
  { value: '40000', label: '$40K+' },
  { value: '50000', label: '$50K+' },
  { value: '60000', label: '$60K+' },
  { value: '70000', label: '$70K+' },
  { value: '80000', label: '$80K+' },
  { value: '100000', label: '$100K+' },
] as const

/** Salary filter maximum threshold options. */
export const SALARY_MAX_OPTIONS = [
  { value: '60000', label: '$60K' },
  { value: '80000', label: '$80K' },
  { value: '100000', label: '$100K' },
  { value: '120000', label: '$120K' },
  { value: '150000', label: '$150K' },
  { value: '200000', label: '$200K' },
] as const

/** localStorage key names used across the app. */
export const STORAGE_KEYS = {
  SAVED: 'savedJobs',
  APPLIED: 'appliedJobs',
  COMPARE: 'compareJobs',
  CLICKS: 'applyClicks',
  TRACKER: 'jobTracker',
  SAVED_SEARCHES: 'savedSearches',
  FILTERS: 'jobFilters',
  SORT: 'jobSort',
  SCROLL: 'homeScrollY',
  RECENTLY_VIEWED: 'recentlyViewed',
  JOB_ALERT_DISMISSED: 'jobAlertDismissed',
  ADMIN_TOKEN: 'admin_token',
} as const

/** App-wide numeric limits. */
export const LIMITS = {
  MAX_COMPARE: 4,
  MAX_CLICKS: 100,
  MAX_SAVED_SEARCHES: 5,
  PAGE_SIZE: 20,
  NOTES_MAX_LENGTH: 500,
  SEARCH_MIN_CHARS: 2,
  SEARCH_DEBOUNCE_MS: 200,
  SEARCH_TIMEOUT_MS: 5000,
  API_JOBS_LIMIT: 1000,
  API_COMPANIES_LIMIT: 2000,
  API_SUGGESTIONS_MAX: 8,
} as const

/** Custom event names dispatched when localStorage lists change. */
export const STORAGE_EVENTS = {
  SAVED: 'savedJobsChanged',
  APPLIED: 'appliedJobsChanged',
  COMPARE: 'compareJobsChanged',
} as const

/** UUID v4 regex for input validation across API routes. */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Accent color for category pills on dark backgrounds (hero sections). */
export const CATEGORY_ACCENT: Record<string, string> = {
  'Investment Banking': 'bg-blue-500 text-white',
  'Private Wealth': 'bg-purple-500 text-white',
  'Accounting': 'bg-emerald-500 text-white',
  'Sales & Trading': 'bg-red-500 text-white',
  'Corporate Finance': 'bg-indigo-500 text-white',
  'Consulting': 'bg-teal-500 text-white',
  'Research': 'bg-cyan-500 text-white',
  'Risk Management': 'bg-orange-500 text-white',
  'Private Equity': 'bg-violet-500 text-white',
  'Commercial Banking': 'bg-sky-500 text-white',
  'Financial Planning': 'bg-lime-500 text-white',
  'Operations': 'bg-slate-500 text-white',
  'Insurance': 'bg-amber-500 text-white',
  'Venture Capital': 'bg-fuchsia-500 text-white',
}

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
  'Financial Planning': 'bg-lime-50 text-lime-700 border-lime-200',
  'Operations': 'bg-slate-50 text-slate-700 border-slate-200',
  'Insurance': 'bg-amber-50 text-amber-700 border-amber-200',
  'Venture Capital': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
}
