'use client'

import { useState, memo } from 'react'
import Image from 'next/image'

interface CompanyLogoProps {
  logoUrl: string | null | undefined
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  imgClassName?: string
  fallbackClassName?: string
  priority?: boolean
}

const sizeMap = {
  sm: { px: 36, cls: 'h-9 w-9 text-xs' },
  md: { px: 44, cls: 'h-11 w-11 text-sm' },
  lg: { px: 56, cls: 'h-14 w-14 text-base' },
}

export default memo(function CompanyLogo({
  logoUrl,
  name,
  size = 'md',
  className = '',
  imgClassName = '',
  fallbackClassName = 'bg-navy-900 text-white',
  priority = false,
}: CompanyLogoProps) {
  const { px, cls } = sizeMap[size]
  const initial = name?.charAt(0).toUpperCase() || '?'
  const [imgError, setImgError] = useState(false)

  if (logoUrl && !imgError) {
    return (
      <Image
        src={logoUrl}
        alt={`${name} logo`}
        width={px}
        height={px}
        priority={priority}
        onError={() => setImgError(true)}
        className={`${cls} rounded-lg object-contain border border-navy-100 bg-white flex-shrink-0 ${imgClassName} ${className}`}
      />
    )
  }

  return (
    <div className={`flex ${cls} items-center justify-center rounded-lg font-bold flex-shrink-0 ${fallbackClassName} ${className}`}>
      {initial}
    </div>
  )
})
