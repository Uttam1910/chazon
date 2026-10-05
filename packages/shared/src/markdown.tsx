import type { ReactNode } from 'react'

// A small, safe Markdown renderer for Insights and case-study text.
// It builds React elements directly — raw HTML in the source is shown as text, never injected —
// and only http(s), mailto, tel and site-relative URLs become links or images.
// Supported: headings (# and ## → h2, ### → h3, #### → h4 — the page title is the only h1), paragraphs,
// - / 1. lists, > quotes, ``` code blocks, --- rules, ![alt](src) images, **bold**, *italic*, `code`, [links](url).

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'code'; text: string }
  | { type: 'rule' }
  | { type: 'image'; alt: string; src: string }

const patterns = {
  fence: /^```/,
  heading: /^(#{1,4})\s+(.+)$/,
  rule: /^\s*([-*_])(\s*\1){2,}\s*$/,
  image: /^!\[([^\]]*)\]\(([^)\s]+)\)$/,
  bullet: /^\s*[-*+]\s+(.*)$/,
  numbered: /^\s*\d+[.)]\s+(.*)$/,
  quote: /^>\s?(.*)$/,
}
const startsBlock = (line: string) =>
  patterns.fence.test(line) || patterns.heading.test(line) || patterns.rule.test(line) || patterns.bullet.test(line) ||
  patterns.numbered.test(line) || patterns.quote.test(line) || patterns.image.test(line.trim())

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    if (patterns.fence.test(line)) {
      const body: string[] = []
      i++
      while (i < lines.length && !patterns.fence.test(lines[i])) body.push(lines[i++])
      i++
      blocks.push({ type: 'code', text: body.join('\n') })
      continue
    }
    const heading = patterns.heading.exec(line)
    if (heading) { blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() }); i++; continue }
    if (patterns.rule.test(line)) { blocks.push({ type: 'rule' }); i++; continue }
    const image = patterns.image.exec(line.trim())
    if (image) { blocks.push({ type: 'image', alt: image[1], src: image[2] }); i++; continue }
    const listKind = patterns.bullet.test(line) ? 'bullet' : patterns.numbered.test(line) ? 'numbered' : null
    if (listKind) {
      const items: string[] = []
      while (i < lines.length && patterns[listKind].test(lines[i])) items.push(patterns[listKind].exec(lines[i++])![1])
      blocks.push({ type: 'list', ordered: listKind === 'numbered', items })
      continue
    }
    if (patterns.quote.test(line)) {
      const body: string[] = []
      while (i < lines.length && patterns.quote.test(lines[i])) body.push(patterns.quote.exec(lines[i++])![1])
      blocks.push({ type: 'quote', text: body.join(' ') })
      continue
    }
    const body: string[] = []
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) body.push(lines[i++].trim())
    blocks.push({ type: 'paragraph', text: body.join(' ') })
  }
  return blocks
}

/** Returns the URL if it is safe to link or embed, otherwise null. */
export function safeUrl(url: string): string | null {
  const value = url.trim()
  if (/^\/(?!\/)/.test(value) || value.startsWith('#')) return value
  try {
    const parsed = new URL(value)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol) ? parsed.href : null
  } catch { return null }
}

const inline = /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|`([^`]+)`|\*([^*]+)\*|(?<![\w])_([^_]+)_(?![\w])/g

type Options = { resolveUrl?: (url: string) => string }

function renderInline(text: string, options: Options, keyPrefix = 'i'): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let n = 0
  for (const match of text.matchAll(inline)) {
    const index = match.index ?? 0
    if (index > last) out.push(text.slice(last, index))
    const key = `${keyPrefix}-${n++}`
    const [whole, imgAlt, imgSrc, linkText, linkHref, bold, code, italic, underscored] = match
    if (imgSrc !== undefined) {
      const src = safeUrl(imgSrc)
      out.push(src && !src.startsWith('mailto:') && !src.startsWith('tel:')
        ? <img key={key} src={options.resolveUrl?.(src) ?? src} alt={imgAlt} loading="lazy" decoding="async"/>
        : whole)
    } else if (linkHref !== undefined) {
      const href = safeUrl(linkHref)
      const external = !!href && /^https?:/.test(href)
      out.push(href
        ? <a key={key} href={options.resolveUrl?.(href) ?? href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{renderInline(linkText, options, key)}</a>
        : linkText)
    } else if (bold !== undefined) out.push(<strong key={key}>{renderInline(bold, options, key)}</strong>)
    else if (code !== undefined) out.push(<code key={key}>{code}</code>)
    else out.push(<em key={key}>{renderInline(italic ?? underscored, options, key)}</em>)
    last = index + whole.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ source, className, resolveUrl }: { source: string; className?: string } & Options) {
  const options = { resolveUrl }
  return <div className={className}>
    {parseMarkdown(source).map((block, i) => {
      switch (block.type) {
        case 'heading': {
          const Tag = (['h2', 'h2', 'h3', 'h4'] as const)[block.level - 1]
          return <Tag key={i}>{renderInline(block.text, options, `b${i}`)}</Tag>
        }
        case 'paragraph': return <p key={i}>{renderInline(block.text, options, `b${i}`)}</p>
        case 'list': {
          const items = block.items.map((item, j) => <li key={j}>{renderInline(item, options, `b${i}-${j}`)}</li>)
          return block.ordered ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>
        }
        case 'quote': return <blockquote key={i}><p>{renderInline(block.text, options, `b${i}`)}</p></blockquote>
        case 'code': return <pre key={i}><code>{block.text}</code></pre>
        case 'rule': return <hr key={i}/>
        case 'image': {
          const src = safeUrl(block.src)
          return src && /^(https?:|\/)/.test(src)
            ? <figure key={i}><img src={resolveUrl?.(src) ?? src} alt={block.alt} loading="lazy" decoding="async"/>{block.alt && <figcaption>{block.alt}</figcaption>}</figure>
            : <p key={i}>{block.alt}</p>
        }
      }
    })}
  </div>
}

/** Plain text with Markdown syntax removed — for excerpts and meta descriptions. */
export function markdownToText(source: string) {
  return parseMarkdown(source).map(block => {
    if (block.type === 'list') return block.items.join(' ')
    if (block.type === 'rule' || block.type === 'image') return ''
    return block.text
  }).join(' ').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim()
}
