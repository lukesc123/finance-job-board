'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import SearchBar from '@/components/SearchBar'
import Filters from '@/components/Filters'
import JobCard from '@/components/JobCard'
import JobCardSkeleton from '@/components/JobCardSkeleton'
import { Job, JobFilters } from '@/types'
import { debounce } from '@/lib/formatting'

type SortBy = 'newest' | 'salary_high' | 'salary_low' | 'company_az'

export default function HomePage() {
  const [filters, setFilters] = useState<JobFilters>({
    category: '',
    job_type: '',
    pipeline_stage: '',
    remote_type: '',
    license: '',
    search: '',
    grad_date: '',
  })

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [visibleCount, setVisibleCount] = useState(20)

  const fetchJobs = useCallback(async (filterState: JobFilters) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()

      if (filterState.category) params.append('category', filterState.category)
      if (filterState.job_type) params.append('job_type', filterState.job_type)
      if (filterState.pipeline_stage) params.append('pipeline_stage', filterState.pipeline_stage)
      if (filterState.remote_type) params.append('remote_type', filterState.remote_type)
      if (filterState.license) params.append('license', filterState.license)
      if (filterState.search) params.append('search', filterState.search)
      if (filterState.grad_date) params.append('grad_date', filterState.grad_date)

      const response = await fetch(`/api/jobs?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch jobs')

      const data = await response.json()
      setJobs(data)
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError('Failed to load jobs. Please try again.')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs(filters)
  }, [])

  const handleFilterChange = (newFilters: JobFilters) => {
    setFilters(newFilters)
    setVisibleCount(20)
    fetchJobs(newFilters)
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        const newFilters = { ...filters, search: query }
        setFilters(newFilters)
        fetchJobs(newFilters)
      }, 300),
    [filters, fetchJobs]
  )

  const handleSearch = (query: string) => {
    debouncedSearch(query)
  }

  const sortedJobs = useMemo(() => {
    const jobsCopy = [...jobs]

    switch (sortBy) {
      case 'newest':
        return jobsCopy.sort(
          (a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
        )
      case 'salary_high':
        return jobsCopy.sort((a, b) => {
          const aMax = a.salary_max || 0
          const bMax = b.salary_max || 0
          return bMax - aMax
        })
      case 'salary_low':
        return jobsCopy.sort((a, b) => {
          const aMin = a.salary_min || 0
          const bMin = b.salary_min || 0
          return aMin - bMin
        })
      case 'company_az':
        return jobsCopy.sort((a, b) =>
          (a.company?.name || '').localeCompare(b.company?.name || '')
        )
      default:
        return jobsCopy
    }
  }, [jobs, sortBy])

  const getSortLabel = () => {
    switch (sortBy) {
      case 'newest':
        return 'newest'
      case 'salary_high':
        return 'highest salary'
      case 'salary_low':
        return 'lowest salary'
      case 'company_az':
        return 'company name'
      default:
        return 'newest'
    }
  }

  const uniqueCompanies = new Set(jobs.map((job) => job.company_id)).size

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-navy$´äÔÀÑ•áÐµÝ¡¥Ñ”Áä´ÄØÁà´ÐÍ´éÁà´Ø±œéÁà´àˆø(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ…àµÜ´Ñá°µàµ…ÕÑ¼Ñ•áÐµ•¹Ñ•Èˆø(€€€€€€€€€€ñ Ä±…ÍÍ9…µ”ô‰Ñ•áÐ´Ñá°Í´éÑ•áÐ´Õá°™½¹Ðµ‰½±µˆ´Ðˆø(€€€€€€€€€€€¹ÑÉäµ1•Ù•°¥¹…¹”)½‰Ì(€€€€€€€€€€ð½ Äø(€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµ±œÑ•áÐµ¹…Ùä´ÈÀÀµˆ´Øˆø(€€€€€€€€€€€ÕÉ…Ñ•Á½Í¥Ñ¥½¹Ì™É½´½µÁ…¹ä…É••ÈÁ…•Ì¸¥¹Ñ¡”É¥¡Ð½ÁÁ½ÉÑÕ¹¥Ñä™½Èå½ÕÈ™¥¹…¹”…É••È¸(€€€€€€€€€€ð½Àø(€€€€€€€€€ì…±½…‘¥¹œ€˜˜©½‰Ì¹±•¹Ñ €ø€À€˜˜€ (€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•È…À´ØÑ•áÐµÍ´Ñ•áÐµ¹…Ùä´ÄÀÀˆø(€€€€€€€€€€€€€€ñÍÁ…¸ùí©½‰Ì¹±•¹Ñ¡ô…Ñ¥Ù”©½‰Ìð½ÍÁ…¸ø(€€€€€€€€€€€€€€ñÍÁ…¸ûŠˆð½ÍÁ…¸ø(€€€€€€€€€€€€€€ñÍÁ…¸ùíÕ¹¥ÅÕ•½µÁ…¹¥•Íô½µÁ…¹¥•Ìð½ÍÁ…¸ø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€¥ô(€€€€€€€€ð½‘¥Øø(€€€€€€ð½Í•Ñ¥½¸ø((€€€€€ì¼¨5…¥¸½¹Ñ•¹Ð€¨½ô(€€€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰µ…àµÜ´Ñá°µàµ…ÕÑ¼Áà´ÐÍ´éÁà´Ø±œéÁà´àÁä´ÄÈˆø(€€€€€€€ì¼¨ÉÉ½È	…¹¹•È€¨½ô(€€€€€€€í•ÉÉ½È€˜˜€ (€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µˆ´àÉ½Õ¹‘•µ±œ‰œµÉ•´ÔÀ‰½É‘•È‰½É‘•ÈµÉ•´ÈÀÀÁà´ÐÁä´Ìˆø(€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµÍ´Ñ•áÐµÉ•´ÜÀÀˆùí•ÉÉ½Éôð½Àø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€¥ô((€€€€€€€ì¼¨M•…É 	…È€¨½ô(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µˆ´àˆø(€€€€€€€€€€ñM•…É¡	…È½¹M•…É õí¡…¹‘±•M•…É¡ô€¼ø(€€€€€€€€ð½‘¥Øø((€€€€€€€ì¼¨¥±Ñ•ÉÌ€¨½ô(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µˆ´àˆø(€€€€€€€€€€ñ¥±Ñ•ÉÌ(€€€€€€€€€€€™¥±Ñ•ÉÌõí™¥±Ñ•ÉÍô(€€€€€€€€€€€½¹¥±Ñ•É¡…¹”õí¡…¹‘±•¥±Ñ•É¡…¹•ô(€€€€€€€€€€€Í½ÉÑ	äõíÍ½ÉÑ	åô(€€€€€€€€€€€½¹M½ÉÑ¡…¹”õì¡Ù…°¤€ôøÍ•ÑM½ÉÑ	ä¡Ù…°…ÌM½ÉÑ	ä¥ô(€€€€€€€€€€¼ø(€€€€€€€€ð½‘¥Øø((€€€€€€€ì¼¨I•ÍÕ±ÑÌ½Õ¹Ð€¨½ô(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µˆ´Øˆø(€€€€€€€€€í±½…‘¥¹œ€ü€ (€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È…À´Èˆø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰¥¹±¥¹”µ‰±½¬ ´ÐÜ´Ð…¹¥µ…Ñ”µÍÁ¥¸É½Õ¹‘•µ™Õ±°‰½É‘•È´È‰½É‘•Èµ¹…Ùä´ÌÀÀ‰½É‘•ÈµÐµ¹…Ùä´ØÀÀˆøð½‘¥Øø(€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµÍ´Ñ•áÐµ¹…Ùä´ØÀÀˆù1½…‘¥¹œ©½‰Ì¸¸¸ð½ÍÁ…¸ø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€¤€è€ (€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµÍ´™½¹Ðµµ•‘¥Õ´Ñ•áÐµ¹…Ùä´ØÀÀˆø(€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµ¹…Ùä´äÀÀˆùíÍ½ÉÑ•‘)½‰Ì¹±•¹Ñ¡ôð½ÍÁ…¸øíÍ½ÉÑ•‘)½‰Ì¹±•¹Ñ €ôôô€Ä€ü€©½ˆœ€è€©½‰Ìô™½Õ¹(€€€€€€€€€€€€€íÍ½ÉÑ•‘)½‰Ì¹±•¹Ñ €ø€À€˜˜€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµ¹…Ùä´ÐÀÀˆøƒ
ÜÍ½ÉÑ•‰äí•ÑM½ÉÑ1…‰•° ¥ôð½ÍÁ…¸ùô(€€€€€€€€€€€€ð½Àø(€€€€€€€€€€¥ô(€€€€€€€€ð½‘¥Øø((€€€€€€€ì¼¨)½‰Ì1¥ÍÐ€¨½ô(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰ÍÁ…”µä´Ìˆø(€€€€€€€€€í±½…‘¥¹œ€ü€ (€€€€€€€€€€€€ðø(€€€€€€€€€€€€€ílÄ°€È°€Ì°€Ð°€Õt¹µ…À ¡¤¤€ôø€ (€€€€€€€€€€€€€€€€ñ)½‰…É‘M­•±•Ñ½¸­•äõí¥ô€¼ø(€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€ð¼ø(€€€€€€€€€€¤€èÍ½ÉÑ•‘)½‰Ì¹±•¹Ñ €ôôô€À€ü€ (€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É½Õ¹‘•µá°‰½É‘•È‰½É‘•Èµ¹…Ùä´ÈÀÀ‰œµ¹…Ùä´ÔÀÁà´ØÁä´ÄØÑ•áÐµ•¹Ñ•Èˆø(€€€€€€€€€€€€€€ñÍÙœ±…ÍÍ9…µ”ô‰µàµ…ÕÑ¼ ´ÄÈÜ´ÄÈÑ•áÐµ¹…Ùä´ÌÀÀµˆ´Ðˆ™¥±°ô‰¹½¹”ˆÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½ÈˆÙ¥•Ý	½àôˆÀ€À€ÈÐ€ÈÐˆø(€€€€€€€€€€€€€€€€ñÁ…Ñ ÍÑÉ½­•1¥¹•…Àô‰É½Õ¹ˆÍÑÉ½­•1¥¹•©½¥¸ô‰É½Õ¹ˆÍÑÉ½­•]¥‘Ñ õìÄ¸Õôô‰4ÈÄ€ÈÅ°´Ø´Ù´È´Õ„Ü€Ü€À€ÄÄ´ÄÐ€À€Ü€Ü€À€ÀÄÄÐ€Áèˆ€¼ø(€€€€€€€€€€€€€€ð½ÍÙœø(€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµ¹…Ùä´ÜÀÀ™½¹ÐµÍ•µ¥‰½±µˆ´Äˆù9¼©½‰Ìµ…Ñ å½ÕÈÉ¥Ñ•É¥„ð½Àø(€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµÍ´Ñ•áÐµ¹…Ùä´ÔÀÀˆùQÉä‰É½…‘•¹¥¹œå½ÕÈ™¥±Ñ•ÉÌ½ÈÍ•…É Ñ•ÉµÌð½Àø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€¤€è€ (€€€€€€€€€€€€ðø(€€€€€€€€€€€€€íÍ½ÉÑ•‘)½‰Ì¹Í±¥” À°Ù¥Í¥‰±•½Õ¹Ð¤¹µ…À ¡©½ˆ¤€ôø€ñ)½‰…É­•äõí©½ˆ¹¥‘ô©½ˆõí©½‰ô€¼ø¥ô(€€€€€€€€€€€€€íÍ½ÉÑ•‘)½‰Ì¹±•¹Ñ €øÙ¥Í¥‰±•½Õ¹Ð€˜˜€ (€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰ÁÐ´ÐÑ•áÐµ•¹Ñ•Èˆø(€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•ÑY¥Í¥‰±•½Õ¹Ð¡ÁÉ•Ø€ôøÁÉ•Ø€¬€ÈÀ¥ô(€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰¥¹±¥¹”µ™±•à¥Ñ•µÌµ•¹Ñ•È…À´ÈÉ½Õ¹‘•µ±œ‰½É‘•È‰½É‘•Èµ¹…Ùä´ÈÀÀ‰œµÝ¡¥Ñ”Áà´ØÁä´ÌÑ•áÐµÍ´™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ¹…Ùä´ÜÀÀÑÉ…¹Í¥Ñ¥½¸¡½Ù•Èé‰œµ¹…Ùä´ÔÀ¡½Ù•Èé‰½É‘•Èµ¹…Ùä´ÌÀÀˆ(€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€M¡½Ü5½É”)½‰Ì(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµáÌÑ•áÐµ¹…Ùä´ÐÀÀˆø(€€€€€€€€€€€€€€€€€€€€€€¡íÍ½ÉÑ•‘)½‰Ì¹±•¹Ñ €´Ù¥Í¥‰±•½Õ¹ÑôÉ•µ…¥¹¥¹œ¤(€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€ð¼ø(€€€€€€€€€€¥ô(€€€€€€€€ð½‘¥Øø(€€€€€€ð½Í•Ñ¥½¸ø(€€€€ð½‘¥Øø(€€¤)ô(