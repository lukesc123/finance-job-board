export function timeAgo(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`)
  if (min && max && min !== max) return `${fmt(min)} - ${fmt(max)}`
  if (min) return fmt(min)
  if (max) return fmt(max)
  return null
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Returns a clearer label for pipeline stages with class-year context.
 * In finance recruiting:
 * - "Sophomore Internship" = programs for rising sophomores (current freshmen)
 * - "Junior Internship" = programs for rising juniors (current sophomores)
 * - "Senior Internship" = summer analyst for rising seniors (current juniors)
 */
export function getPipelineStageDisplay(stage: string): { label: string; subtitle: string } {
  switch (stage) {
    case 'Sophomore Internship':
      return { label: 'Sophomore Intern', subtitle: 'For rising sophomores (freshmen)' }
    case 'Junior Internship':
      return { label: 'Junior Intern', subtitle: 'For rising juniors (sophomores)' }
    case 'Senior Internship':
      return { label: 'Senior Intern', subtitle: 'For rising seniors (juniors)' }
    case 'New Grad':
      return { label: 'New Grad', subtitle: 'Recent graduates' }
    case 'Early Career':
      return { label: 'Early Career', subtitle: '1-3 years experience' }
    case 'No Experience Required':
      return { label: 'No Exp. Required', subtitle: 'Open to all levels' }
    default:
      return { label: stage, subtitle: '' }
  }
}

/**
 * Returns target graduation year text based on grad date fields
 */
export function getGradYearText(earliest: string | null, latest: string | null): string | null {
  if (!earliest && !latest) return null
  const date = latest || earliest
  if (!date) return null
  const year = new Date(date).getFullYear()
  return `Class of ${year}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
