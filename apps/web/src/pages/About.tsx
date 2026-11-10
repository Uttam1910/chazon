import {
  ArrowRight,
  BarChart3,
  Compass,
  Cpu,
  Eye,
  FileText,
  Heart,
  Laptop,
  Layers,
  Mail,
  Megaphone,
  RotateCcw,
  Search,
  Settings,
  Share2,
  Target,
  TrendingUp,
  Users,
  Users2,
} from 'lucide-react'
import { Link } from '../router'
import { breadcrumbSchema, usePageMeta } from '../seo'
import { PageShell } from '../components/Layout'
import { DashboardMockup } from '../components/DashboardMockup'

export function About() {
  usePageMeta({
    title: 'About Chazon Digital Ventures | Digital Growth Partner',
    description:
      'Chazon Digital Ventures is a digital growth partner helping businesses build, strengthen and optimise their digital presence through strategy, technology, marketing and automation.',
    path: '/about',
    schema: breadcrumbSchema([['About Us', '/about']]),
  })

  return (
    <PageShell hideFooterCta>
      {/* 1. ABOUT HERO */}
      <section className="about-hero-section surface-cream" aria-labelledby="about-hero-title">
        <div className="container">
          <div className="about-hero-grid">
            <div className="about-hero-copy">
              <div className="about-breadcrumb" aria-label="Breadcrumb">
                <span className="about-breadcrumb-diamond" aria-hidden="true">❖</span> About Us
              </div>
              <h1 id="about-hero-title" className="about-hero-title">
                We build digital foundations for businesses{' '}
                <span className="serif-italic-accent">ready to grow.</span>
              </h1>
              <p className="about-hero-lead">
                Chazon Digital Ventures is a digital growth partner helping businesses build,
                strengthen and optimise their digital presence through strategy, technology,
                marketing and automation.
              </p>
              <div className="about-hero-buttons">
                <a href="#framework" className="button button-primary">
                  Explore Our Approach <ArrowRight size={18} />
                </a>
                <Link to="/contact" className="button button-secondary">
                  Let’s Work Together
                </Link>
              </div>
            </div>

            <div className="about-hero-visual">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* 2. OUR STORY */}
      <section className="section about-story-section surface-cream" aria-labelledby="about-story-title">
        <div className="container">
          <div className="about-story-grid">
            <div className="about-story-visual-col">
              <div className="about-story-image-card">
                <picture>
                  <source srcSet="/assets/about-team-story.webp" type="image/webp" />
                  <img
                    src="/assets/about-team-story.png"
                    alt="Chazon Digital Ventures cross-functional team collaborating on digital growth strategies"
                    className="about-story-img"
                    width={930}
                    height={504}
                    loading="lazy"
                  />
                </picture>
              </div>
            </div>

            <div className="about-story-copy-col">
              <span className="about-eyebrow-orange">OUR STORY</span>
              <h2 id="about-story-title" className="about-story-title">
                A better way to approach digital growth.
              </h2>
              <p className="about-story-p">
                Businesses often invest in websites, advertising, social media and technology
                separately. But these activities deliver greater value when they work together.
              </p>
              <p className="about-story-p">
                Chazon was built around a simple belief: digital growth should be connected to
                business objectives, customer experiences and measurable outcomes.
              </p>
              <div className="about-story-callout">
                <span className="about-story-callout-bar" aria-hidden="true" />
                <blockquote className="about-story-callout-quote">
                  We bring strategy, technology and marketing together to help businesses move from
                  digital presence to meaningful business growth.
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VISION AND MISSION */}
      <section className="section about-vm-section surface-cream" aria-labelledby="about-vm-title">
        <div className="container">
          <h2 id="about-vm-title" className="visually-hidden">Our Vision and Mission</h2>
          <div className="about-vm-grid">
            {/* Vision Card - Dark Charcoal Treatment */}
            <div className="about-vm-card about-vm-card-vision">
              <div className="about-vm-header">
                <div className="about-vm-icon-wrap" aria-hidden="true">
                  <Eye size={20} />
                </div>
                <span className="about-vm-label">Our Vision</span>
              </div>
              <h3 className="about-vm-headline about-vm-headline-light">
                Make digital growth more meaningful.
              </h3>
              <p className="about-vm-desc about-vm-desc-light">
                Help businesses unlock opportunities through connected digital experiences and smarter technology.
              </p>
              {/* Subtle decorative curves accent */}
              <svg className="about-vm-contour-svg" viewBox="0 0 160 90" fill="none" aria-hidden="true">
                <path d="M0 90 C 40 70, 90 85, 160 30" stroke="rgba(216, 69, 2, 0.28)" strokeWidth="1.5" />
                <path d="M15 90 C 55 65, 105 75, 160 15" stroke="rgba(216, 69, 2, 0.22)" strokeWidth="1.5" />
                <path d="M30 90 C 70 58, 120 62, 160 0" stroke="rgba(216, 69, 2, 0.16)" strokeWidth="1.5" />
                <path d="M45 90 C 85 50, 135 50, 160 -15" stroke="rgba(216, 69, 2, 0.1)" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Mission Card - Warm Ivory/Peach Treatment */}
            <div className="about-vm-card about-vm-card-mission">
              <div className="about-vm-header">
                <div className="about-vm-icon-wrap" aria-hidden="true">
                  <Target size={20} />
                </div>
                <span className="about-vm-label">Our Mission</span>
              </div>
              <h3 className="about-vm-headline about-vm-headline-dark">
                Turn strategy into action.
              </h3>
              <p className="about-vm-desc about-vm-desc-dark">
                Build and optimise digital solutions that support discoverability, customer acquisition, conversion and retention.
              </p>
              {/* Subtle decorative curves accent */}
              <svg className="about-vm-wave-svg" viewBox="0 0 160 90" fill="none" aria-hidden="true">
                <path d="M-10 90 Q 60 40, 160 65 L 160 90 Z" fill="rgba(216, 69, 2, 0.08)" />
                <path d="M20 90 Q 90 25, 160 45 L 160 90 Z" fill="rgba(216, 69, 2, 0.06)" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHAT MAKES CHAZON DIFFERENT */}
      <section className="section about-different-section surface-cream" aria-labelledby="about-diff-title">
        <div className="container">
          <div className="about-different-head-split">
            <div className="adhs-left">
              <span className="about-eyebrow-orange">WHAT MAKES CHAZON DIFFERENT</span>
              <h2 id="about-diff-title" className="about-diff-title">
                A connected and results-driven approach.
              </h2>
            </div>
            <div className="adhs-right">
              <p className="about-diff-intro">
                We combine business understanding, digital expertise and the right technology to
                create solutions that deliver real and measurable impact.
              </p>
            </div>
          </div>

          <div className="about-diff-grid">
            <div className="about-diff-col">
              <div className="about-diff-icon-wrap" aria-hidden="true">
                <BarChart3 size={24} />
              </div>
              <h3 className="about-diff-col-title">Revenue-led thinking</h3>
              <p className="about-diff-col-desc">
                Digital decisions should support real business objectives, not just look impressive.
              </p>
            </div>

            <div className="about-diff-col">
              <div className="about-diff-icon-wrap" aria-hidden="true">
                <Layers size={24} />
              </div>
              <h3 className="about-diff-col-title">Connected capabilities</h3>
              <p className="about-diff-col-desc">
                Websites, SEO, marketing, CRM and automation work together as one growth system.
              </p>
            </div>

            <div className="about-diff-col">
              <div className="about-diff-icon-wrap" aria-hidden="true">
                <Cpu size={24} />
              </div>
              <h3 className="about-diff-col-title">Technology-driven solutions</h3>
              <p className="about-diff-col-desc">
                Use appropriate technology to solve business and customer experience problems.
              </p>
            </div>

            <div className="about-diff-col">
              <div className="about-diff-icon-wrap" aria-hidden="true">
                <RotateCcw size={24} />
              </div>
              <h3 className="about-diff-col-title">Continuous optimisation</h3>
              <p className="about-diff-col-desc">
                Analyse performance, identify opportunities and improve over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. THE CHAZON GROWTH FRAMEWORK */}
      <section className="section about-framework-section surface-cream" id="framework" aria-labelledby="about-framework-title">
        <div className="container">
          <div className="about-framework-card">
            <div className="about-framework-header">
              <span className="about-eyebrow-orange">THE CHAZON GROWTH FRAMEWORK</span>
              <h2 id="about-framework-title" className="about-framework-title">
                A practical growth framework for real business results.
              </h2>
              <p className="about-framework-subtitle">
                Our five-stage framework brings structure, focus and continuity to your digital growth journey.
              </p>
            </div>

            <div className="about-framework-timeline">
              <div className="about-framework-line" aria-hidden="true" />
              <div className="about-framework-nodes">
                {/* 1. Discover */}
                <div className="about-fn-item">
                  <div className="about-fn-node">
                    <Search size={22} className="about-fn-icon" />
                  </div>
                  <h3 className="about-fn-name">Discover</h3>
                  <p className="about-fn-desc">Improve visibility and discoverability.</p>
                </div>

                {/* 2. Attract */}
                <div className="about-fn-item">
                  <div className="about-fn-node">
                    <Users size={22} className="about-fn-icon" />
                  </div>
                  <h3 className="about-fn-name">Attract</h3>
                  <p className="about-fn-desc">Reach the right audience.</p>
                </div>

                {/* 3. Convert */}
                <div className="about-fn-item">
                  <div className="about-fn-node">
                    <Target size={22} className="about-fn-icon" />
                  </div>
                  <h3 className="about-fn-name">Convert</h3>
                  <p className="about-fn-desc">Turn visitors into customers.</p>
                </div>

                {/* 4. Retain */}
                <div className="about-fn-item">
                  <div className="about-fn-node">
                    <Heart size={22} className="about-fn-icon" />
                  </div>
                  <h3 className="about-fn-name">Retain</h3>
                  <p className="about-fn-desc">Build lasting customer relationships.</p>
                </div>

                {/* 5. Grow */}
                <div className="about-fn-item about-fn-item-highlight">
                  <div className="about-fn-node about-fn-node-filled">
                    <TrendingUp size={22} className="about-fn-icon-white" />
                  </div>
                  <h3 className="about-fn-name">Grow</h3>
                  <p className="about-fn-desc">Optimise performance and increase revenue.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. OUR CAPABILITIES */}
      <section className="section about-capabilities-section surface-cream" aria-labelledby="about-caps-title">
        <div className="container">
          <div className="about-caps-split">
            <div className="about-caps-intro-col">
              <span className="about-eyebrow-orange">OUR CAPABILITIES</span>
              <h2 id="about-caps-title" className="about-caps-title">
                End-to-end digital growth capabilities.
              </h2>
              <p className="about-caps-lead">
                From building high-performing websites to running impactful marketing and automation,
                we bring together the expertise you need to grow online.
              </p>
              <div className="about-caps-btn-wrap">
                <Link to="/services" className="button button-outline-orange">
                  Explore Our Services <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="about-caps-grid-col">
              <div className="about-capabilities-grid">
                {/* 1. Website Development */}
                <Link to="/services/website-development" className="about-cap-cell">
                  <div className="acc-icon-box"><Laptop size={22} /></div>
                  <span className="acc-label">Website Development</span>
                </Link>

                {/* 2. UI / UX Design */}
                <Link to="/services/ui-ux-design" className="about-cap-cell">
                  <div className="acc-icon-box"><Compass size={22} /></div>
                  <span className="acc-label">UI / UX Design</span>
                </Link>

                {/* 3. SEO */}
                <Link to="/services/search-engine-optimisation" className="about-cap-cell">
                  <div className="acc-icon-box"><Search size={22} /></div>
                  <span className="acc-label">Search Engine Optimisation</span>
                </Link>

                {/* 4. Digital Marketing */}
                <Link to="/services/digital-marketing" className="about-cap-cell">
                  <div className="acc-icon-box"><Megaphone size={22} /></div>
                  <span className="acc-label">Digital Marketing</span>
                </Link>

                {/* 5. Social Media Marketing */}
                <Link to="/services/social-media-marketing" className="about-cap-cell">
                  <div className="acc-icon-box"><Share2 size={22} /></div>
                  <span className="acc-label">Social Media Marketing</span>
                </Link>

                {/* 6. Paid Advertising */}
                <Link to="/services/ppc-advertising" className="about-cap-cell">
                  <div className="acc-icon-box"><TrendingUp size={22} /></div>
                  <span className="acc-label">Paid Advertising</span>
                </Link>

                {/* 7. Content Marketing */}
                <Link to="/services/content-marketing" className="about-cap-cell">
                  <div className="acc-icon-box"><FileText size={22} /></div>
                  <span className="acc-label">Content Marketing</span>
                </Link>

                {/* 8. Email Marketing */}
                <Link to="/services/email-marketing" className="about-cap-cell">
                  <div className="acc-icon-box"><Mail size={22} /></div>
                  <span className="acc-label">Email Marketing</span>
                </Link>

                {/* 9. Affiliate & Influencer Marketing */}
                <Link to="/services/affiliate-influencer-marketing" className="about-cap-cell">
                  <div className="acc-icon-box"><Users2 size={22} /></div>
                  <span className="acc-label">Affiliate & Influencer Marketing</span>
                </Link>

                {/* 10. Automation & CRM Integration */}
                <Link to="/services/business-automation" className="about-cap-cell">
                  <div className="acc-icon-box"><Settings size={22} /></div>
                  <span className="acc-label">Automation & CRM Integration</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. HOW WE WORK */}
      <section className="section about-how-section surface-cream" aria-labelledby="about-how-title">
        <div className="container">
          <div className="about-how-split">
            <div className="about-how-left">
              <span className="about-eyebrow-orange">HOW WE WORK</span>
              <h2 id="about-how-title" className="about-how-title">
                A clear, collaborative and result-oriented process.
              </h2>
            </div>
            <div className="about-how-right">
              <div className="about-how-timeline">
                <div className="about-how-track-line" aria-hidden="true" />
                <div className="about-how-steps">
                  {/* Step 1 */}
                  <div className="about-how-step">
                    <div className="ahs-badge">1</div>
                    <h3 className="ahs-title">Discover</h3>
                    <p className="ahs-desc">Understand the business and challenges.</p>
                  </div>

                  {/* Step 2 */}
                  <div className="about-how-step">
                    <div className="ahs-badge">2</div>
                    <h3 className="ahs-title">Strategise</h3>
                    <p className="ahs-desc">Define the direction and priorities.</p>
                  </div>

                  {/* Step 3 */}
                  <div className="about-how-step">
                    <div className="ahs-badge">3</div>
                    <h3 className="ahs-title">Build</h3>
                    <p className="ahs-desc">Develop the digital solutions.</p>
                  </div>

                  {/* Step 4 */}
                  <div className="about-how-step">
                    <div className="ahs-badge">4</div>
                    <h3 className="ahs-title">Execute</h3>
                    <p className="ahs-desc">Launch and implement the strategy.</p>
                  </div>

                  {/* Step 5 */}
                  <div className="about-how-step">
                    <div className="ahs-badge">5</div>
                    <h3 className="ahs-title">Measure</h3>
                    <p className="ahs-desc">Review results and identify opportunities.</p>
                  </div>

                  {/* Step 6 */}
                  <div className="about-how-step">
                    <div className="ahs-badge">6</div>
                    <h3 className="ahs-title">Optimise</h3>
                    <p className="ahs-desc">Refine and improve performance.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA BANNER */}
      <section className="home-orange-cta-banner" id="contact" aria-labelledby="about-cta-title">
        <div className="home-orange-cta-wave-pattern" aria-hidden="true" />
        <div className="container home-orange-cta-inner">
          <div className="home-orange-cta-copy">
            <h2 id="about-cta-title" className="home-orange-cta-title">
              Ready to Turn Your Digital Presence into Business Growth?
            </h2>
            <p className="home-orange-cta-subtitle">
              Let’s build a smarter digital growth strategy for your business.
            </p>
          </div>
          <div className="home-orange-cta-btn-wrap">
            <Link to="/contact" className="home-orange-cta-button">
              Start a Conversation <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
