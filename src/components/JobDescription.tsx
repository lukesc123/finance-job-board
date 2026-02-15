'use client'

import React, { memo } from 'react'

/**
 * Renders job descriptions with basic formatting:
 * - Detects bullet points (-, *, •) and renders as lists
 * - Detects numbered lists (1., 2., etc.)
 * - Bolds text wrapped in ** or ALL CAPS headers
 * - Preserves paragraph breaks
 * - Linkifies URLs
 */

function linkify(text: string): (string | React.ReactElement)[] {
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  const parts = text.split(urlRegex)
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-navy-600 underline decoration-navy-300 hover:text-navy-800 hover:decoration-navy-500 transition"
        >
          {part.length > 60 ? part.substring(0, 57) + '...' : part}
        </a>
      )
    }
    return part
  })
}

function formatLine(line: string): (string | React.ReactElement)[] {
  // Bold **text**
  const boldRegex = /\*\*(.+?)\*\*/g
  const parts: (string | React.ReactElement)[] = []
  let lastIndex = 0
  let match

  while ((match = boldRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...linkify(line.substring(lastIndex, match.index)))
    }
    parts.push(<strong key={`b-${match.index}`} className="font-semibold text-navy-900">{match[1]}</strong>)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < line.length) {
    parts.push(...linkify(line.substring(lastIndex)))
  }

  return parts.length > 0 ? parts : linkify(line)
}

function isAllCapsHeader(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length < 3 || trimmed.length > 80) return false
  // Check if mostly uppercase letters (allowing colons, spaces, &)
  const alphaOnly = trimmed.replace(/[^a-zA-Z]/g, '')
  if (alphaOnly.length < 3) return false
  return alphaOnly === alphaOnly.toUpperCase() && /^[A-Z\s&/,:-]+$/.test(trimmed)
}

function isBulletLine(line: string): boolean {
  return /^\s*[-*•]\s/.test(line)
}

function isNumberedLine(line: string): boolean {
  return /^\s*\d+[.)]\s/.test(line)
}

function getBulletContent(line: string): string {
  return line.replace(/^\s*[-*•]\s+/, '').trim()
}

function getNumberedContent(line: string): string {
  return line.replace(/^\s*\d+[.)]\s+/, '').trim()
}

interface JobDescriptionProps {
  text: string
}

export default memo(function JobDescription({ text }: JobDescriptionProps) {
  if (!text) return null

  const lines = text.split('\n')
  const elements: React.ReactElement[] = []
  let currentBullets: string[] = []
  let currentNumbered: string[] = []
  let currentParagraph: string[] = []

  function flushParagraph() {
    if (currentParagraph.length > 0) {
      const content = currentParagraph.join(' ').trim()
      if (content) {
        elements.push(
          <p key={`p-${elements.length}`} className="text-navy-700 leading-relaxed text-[15px]">
            {formatLine(content)}
          </p>
        )
      }
      currentParagraph = []
    }
  }

  function flushBullets() {
    if (currentBullets.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1.5 ml-1">
          {currentBullets.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-navy-700 text-[15px] leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-navy-400 flex-shrink-0" />
              <span>{formatLine(item)}</span>
            </li>
          ))}
        </ul>
      )
      currentBullets = []
    }
  }

  function flushNumbered() {
    if (currentNumbered.length > 0) {
      elements.push(
        <ol key={`ol-${elements.length}`} className="space-y-1.5 ml-1 list-decimal list-inside">
          {currentNumbered.map((item, i) => (
            <li key={i} className="text-navy-700 text-[15px] leading-relaxed">
              {formatLine(item)}
            </li>
          ))}
        </ol>
      )
      currentNumbered = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Empty line = paragraph break
    if (!trimmed) {
      flushParagraph()
      flushBullets()
      flushNumbered()
      continue
    }

    // ALL CAPS header
    if (isAllCapsHeader(trimmed)) {
      flushParagraph()
      flushBullets()
      flushNumbered()
      elements.push(
        <h3 key={`h-${elements.length}`} className="text-sm font-bold text-navy-900 uppercase tracking-wide">
          {trimmed.charAt(0) + trimmed.slice(1).toLowerCase()}
        </h3>
      )
      continue
    }

    // Bullet point
    if (isBulletLine(line)) {
      flushParagraph()
      flushNumbered()
      currentBullets.push(getBulletContent(line))
      continue
    }

    // Numbered list
    if (isNumberedLine(line)) {
      flushParagraph()
      flushBullets()
      currentNumbered.push(getNumberedContent(line))
      continue
    }

    // Regular text - accumulate into paragraph
    flushBullets()
    flushNumbered()
    currentParagraph.push(trimmed)
  }

  // Flush remaining
  flushParagraph()
  flushBullets()
  flushNumbered()

  return <div className="space-y-3">{elements}</div>
})
