import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from '../router'

interface InsightItem {
  id: string
  slug: string
  title: string
  category: 'Strategy' | 'SEO' | 'Marketing' | 'Automation' | 'Digital Revenue'
  readingTime: string
  excerpt: string
  image?: string
  date: string
}

const HOMEPAGE_ARTICLES = [
  {
    id: 'enquiries',
    slug: 'why-traffic-doesnt-always-mean-revenue',
    title: 'Why Your Website Isn’t Generating Enquiries',
    category: 'Marketing',
    readingTime: '5 min read',
    image: '/assets/insights/insight-1.png',
  },
  {
    id: 'seo-vs-ads',
    slug: 'top-seo-strategies-to-improve-visibility-2026',
    title: 'SEO vs. Paid Advertising: Which Is Right for Your Business?',
    category: 'Digital Marketing',
    readingTime: '6 min read',
    image: '/assets/insights/insight-2.png',
  },
  {
    id: 'crm-whatsapp',
    slug: 'whatsapp-marketing-for-better-customer-engagement',
    title: 'How CRM and WhatsApp Automation Help Businesses Grow',
    category: 'Automation',
    readingTime: '5 min read',
    image: '/assets/insights/insight-3.png',
  },
]

const CATALOG_ITEMS: InsightItem[] = [
  {
    id: 'revenue-engine',
    slug: 'how-to-build-a-digital-revenue-engine',
    title: 'How to Build a Digital Revenue Engine for Your Business',
    category: 'Strategy',
    readingTime: '6 min read',
    excerpt: 'Move away from a passive, brochure-style website. Discover how to architect an integrated revenue system that turns traffic into paying clients.',
    date: 'Updated for 2026',
  },
  {
    id: 'top-seo',
    slug: 'top-seo-strategies-to-improve-visibility-2026',
    title: 'Top SEO Strategies to Improve Your Visibility in 2026',
    category: 'SEO',
    readingTime: '5 min read',
    excerpt: 'Buyer-intent keyword mapping, local schema markup, and Core Web Vitals optimizations that directly drive qualified inbound leads.',
    date: 'Nov 2026',
  },
  {
    id: 'whatsapp-marketing',
    slug: 'whatsapp-marketing-for-better-customer-engagement',
    title: 'WhatsApp Marketing for Better Customer Engagement',
    category: 'Marketing',
    readingTime: '4 min read',
    excerpt: 'How sub-5-minute chat response times, automated triage, and CRM integration convert high-intent prospects into customers.',
    date: 'Nov 2026',
  },
  {
    id: 'traffic-vs-revenue',
    slug: 'why-traffic-doesnt-always-mean-revenue',
    title: 'Why traffic doesn’t always mean revenue',
    category: 'Strategy',
    readingTime: '4 min read',
    excerpt: 'The gap between attracting visitors and helping them become customers — and the common leakages where businesses lose them.',
    date: 'Oct 2026',
  },
]

export function InsightsShowcase({ isPage = false }: { isPage?: boolean }) {
  const [activeCategory, setActiveCategory] = useState<string>('All')

  if (!isPage) {
    return (
      <div className="insights-home-cards-row" role="list" aria-label="Selected Insights and Articles">
        {HOMEPAGE_ARTICLES.map((art) => (
          <Link
            key={art.id}
            to={`/insights/${art.slug}`}
            className="insight-home-card"
            role="listitem"
          >
            <div className="ihc-image-wrap">
              <img
                src={art.image}
                alt={art.title}
                className="ihc-image"
                loading="lazy"
                width={360}
                height={200}
              />
            </div>
            <div className="ihc-content">
              <h3 className="ihc-title">{art.title}</h3>
              <div className="ihc-meta">
                <span className="ihc-category">{art.category}</span>
                <span className="ihc-dot">·</span>
                <span className="ihc-time">{art.readingTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    )
  }

  // Full Catalog Page mode
  const categories = ['All', 'Strategy', 'SEO', 'Marketing', 'Automation']
  const filtered =
    activeCategory === 'All'
      ? CATALOG_ITEMS
      : CATALOG_ITEMS.filter((i) => i.category === activeCategory)

  return (
    <div className="insights-showcase-component">
      <div className="insights-filter-pills" role="tablist" aria-label="Filter insights by topic">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat}
            className={`filter-pill ${activeCategory === cat ? 'is-active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="insights-catalog-grid" role="list">
        {filtered.map((item) => (
          <article key={item.id} className="insight-catalog-card" role="listitem">
            <Link to={`/insights/${item.slug}`} className="icc-link">
              <span className="icc-category">{item.category}</span>
              <h3 className="icc-title">{item.title}</h3>
              <p className="icc-excerpt">{item.excerpt}</p>
              <div className="icc-footer">
                <span className="icc-time">{item.readingTime}</span>
                <span className="icc-arrow">
                  Read Article <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
