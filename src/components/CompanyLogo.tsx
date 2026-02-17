'use client'

import { useState, memo, useMemo } from 'react'
import Image from 'next/image'

interface CompanyLogoProps {
  logoUrl: string | null | undefined
  name: string
  website?: string | null
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

function getDomainFromWebsite(website: string | null | undefined): string | null {
  if (!website) return null
  try {
    const url = website.startsWith('http') ? website : `https://${website}`
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return null
  }
}

function guessCompanyDomain(name: string): string | null {
  // Map known companies to their domains
  const knownDomains: Record<string, string> = {
    'jpmorgan chase': 'jpmorgan.com',
    'j.p. morgan': 'jpmorgan.com',
    'goldman sachs': 'goldmansachs.com',
    'morgan stanley': 'morganstanley.com',
    'bank of america': 'bankofamerica.com',
    'wells fargo': 'wellsfargo.com',
    'citigroup': 'citi.com',
    'citi': 'citi.com',
    'charles schwab': 'schwab.com',
    'blackrock': 'blackrock.com',
    'vanguard': 'vanguard.com',
    'fidelity': 'fidelity.com',
    'fidelity investments': 'fidelity.com',
    'state street': 'statestreet.com',
    'ubs': 'ubs.com',
    'deutsche bank': 'db.com',
    'barclays': 'barclays.com',
    'credit suisse': 'credit-suisse.com',
    'hsbc': 'hsbc.com',
    'bnp paribas': 'bnpparibas.com',
    'deloitte': 'deloitte.com',
    'kpmg': 'kpmg.com',
    'ey': 'ey.com',
    'ernst & young': 'ey.com',
    'pwc': 'pwc.com',
    'pricewaterhousecoopers': 'pwc.com',
    'lazard': 'lazard.com',
    'evercore': 'evercore.com',
    'houlihan lokey': 'hl.com',
    'piper sandler': 'pipersandler.com',
    'raymond james': 'raymondjames.com',
    'robert half': 'roberthalf.com',
    'northern trust': 'northerntrust.com',
    'bny mellon': 'bnymellon.com',
    'ameriprise': 'ameriprise.com',
    'edward jones': 'edwardjones.com',
    't. rowe price': 'troweprice.com',
    'franklin templeton': 'franklintempleton.com',
    'invesco': 'invesco.com',
    'principal financial': 'principal.com',
    'jefferies': 'jefferies.com',
    'stifel': 'stifel.com',
    'baird': 'rwbaird.com',
    'william blair': 'williamblair.com',
    'guggenheim': 'guggenheimpartners.com',
    'moelis': 'moelis.com',
    'centerview partners': 'centerviewpartners.com',
    'perella weinberg': 'pwpartners.com',
    'pjt partners': 'pjtpartners.com',
    'greenhill': 'greenhill.com',
    'macquarie': 'macquarie.com',
    'nomura': 'nomura.com',
    'cowen': 'cowen.com',
    'oppenheimer': 'oppenheimer.com',
    'truist': 'truist.com',
    'citizens financial': 'citizensbank.com',
    'citizens bank': 'citizensbank.com',
    'us bank': 'usbank.com',
    'u.s. bank': 'usbank.com',
    'pnc': 'pnc.com',
    'td bank': 'td.com',
    'ally financial': 'ally.com',
    'synchrony': 'synchrony.com',
    'discover': 'discover.com',
    'capital one': 'capitalone.com',
    'american express': 'americanexpress.com',
    'amex': 'americanexpress.com',
    'visa': 'visa.com',
    'mastercard': 'mastercard.com',
    'marsh mclennan': 'marshmclennan.com',
    'aon': 'aon.com',
    'willis towers watson': 'wtwco.com',
    'berkshire hathaway': 'berkshirehathaway.com',
    'apollo': 'apollo.com',
    'kkr': 'kkr.com',
    'carlyle': 'carlyle.com',
    'blackstone': 'blackstone.com',
    'tpg': 'tpg.com',
    'ares management': 'aresmgmt.com',
    'citadel': 'citadel.com',
    'two sigma': 'twosigma.com',
    'bridgewater': 'bridgewater.com',
    'point72': 'point72.com',
    'millennium': 'mlp.com',
    'jane street': 'janestreet.com',
    'de shaw': 'deshaw.com',
    'd.e. shaw': 'deshaw.com',
  }

  const lower = name.toLowerCase().trim()
  if (knownDomains[lower]) return knownDomains[lower]

  // Try simple domain guess: "Company Name" -> "companyname.com"
  const simple = lower.replace(/[^a-z0-9]/g, '') + '.com'
  return simple
}

export default memo(function CompanyLogo({
  logoUrl,
  name,
  website,
  size = 'md',
  className = '',
  imgClassName = '',
  fallbackClassName = 'bg-navy-900 text-white',
  priority = false,
}: CompanyLogoProps) {
  const { px, cls } = sizeMap[size]
  const initial = name?.charAt(0).toUpperCase() || '?'
  const [imgError, setImgError] = useState(false)
  const [faviconError, setFaviconError] = useState(false)
  const [clearbitError, setClearbitError] = useState(false)

  const domain = useMemo(() => getDomainFromWebsite(website) || guessCompanyDomain(name), [website, name])
  const faviconUrl = domain ? `/api/favicon?domain=${encodeURIComponent(domain)}` : null
  const clearbitUrl = domain ? `https://logo.clearbit.com/${domain}` : null

  // Use explicit logo_url first
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

  // Try Google favicon via proxy
  if (faviconUrl && !faviconError) {
    return (
      <img
        src={faviconUrl}
        alt={`${name} logo`}
        width={px}
        height={px}
        loading="lazy"
        decoding="async"
        onError={() => setFaviconError(true)}
        className={`${cls} rounded-lg object-contain border border-navy-100 bg-white p-1.5 flex-shrink-0 ${imgClassName} ${className}`}
      />
    )
  }

  // Try Clearbit logo API
  if (clearbitUrl && !clearbitError) {
    return (
      <img
        src={clearbitUrl}
        alt={`${name} logo`}
        width={px}
        height={px}
        loading="lazy"
        decoding="async"
        onError={() => setClearbitError(true)}
        className={`${cls} rounded-lg object-contain border border-navy-100 bg-white p-1 flex-shrink-0 ${imgClassName} ${className}`}
      />
    )
  }

  // Fallback to initial letter
  return (
    <div className={`flex ${cls} items-center justify-center rounded-lg font-bold flex-shrink-0 ${fallbackClassName} ${className}`}>
      {initial}
    </div>
  )
})
