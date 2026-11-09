import type { Finding } from '@chazon/shared';

/**
 * Deterministic, rule-based business explanations for audit findings.
 * Designed specifically for non-technical business owners, translating
 * technical findings into 5 clear questions without using AI or external APIs:
 *
 * 1. WHAT IS THE ISSUE?
 * 2. WHY DOES IT MATTER?
 * 3. HOW CAN IT AFFECT YOUR BUSINESS?
 * 4. WHAT SHOULD YOU DO?
 * 5. WHAT IF YOU DON'T FIX IT?
 */

export interface BusinessExplanation {
  /** 1. WHAT IS THE ISSUE? - Plain-language explanation of what is wrong */
  whatIsWrong: string;
  /** 2. WHY DOES IT MATTER? - Why this issue is important for the website and its visitors */
  whyItMatters: string;
  /** 3. HOW CAN IT AFFECT YOUR BUSINESS? - Realistic consequences for visitors, CX, trust, visibility, enquiries, sales */
  businessImpact: string;
  /** 4. WHAT SHOULD YOU DO? - Practical, non-technical recommendation */
  whatToDo: string;
  /** 5. WHAT IF YOU DON'T FIX IT? - Realistic downside without exaggeration or fear-based language */
  whatIfIgnored: string;
  /** One-line plain explanation for the collapsed card */
  shortExplanation: string;
  /** Short business impact summary for the collapsed card */
  shortImpact: string;
  /** Why this issue was prioritised (used in Top 3) */
  priorityReason: string;
  /** Plain-language takeaway for the business owner (used in Top 3) */
  ownerTakeaway: string;
  /** Recommended next step for the owner (used in Top 3) */
  recommendedNextStep: string;
  /** Clear status note for manual-review or hypothesis */
  statusNote?: string;
}

interface RuleExplanationTemplate {
  whatIsWrong: string;
  whyItMatters: string;
  businessImpact: string;
  whatToDo: string;
  whatIfIgnored: string;
  shortExplanation: string;
  shortImpact: string;
  priorityReason: string;
  ownerTakeaway: string;
  recommendedNextStep: string;
}

/**
 * Dictionary of rule-based explanations mapped to stable finding IDs.
 */
const RULE_EXPLANATIONS: Record<string, RuleExplanationTemplate> = {
  // =========================================================================
  // 1. Performance and Speed
  // =========================================================================
  'lh.metric.largest-contentful-paint': {
    whatIsWrong: 'The primary visual content (such as a large hero image, banner, or main headline) takes several seconds to load on screen.',
    whyItMatters: 'First impressions form within two to three seconds. When visitors wait for the screen to fill in, they quickly assume the website is broken or sluggish.',
    businessImpact: 'Visitors browsing on mobile or slower connections may leave before reading your offer or contacting you. This potential drop-off can reduce enquiry rates and marketing ad efficiency.',
    whatToDo: 'Ask your web developer or agency to compress hero images, enable modern web image formats (WebP/AVIF), and defer non-critical scripts.',
    whatIfIgnored: 'Visitors may bounce to faster competitors, and Google may penalise search rankings under Core Web Vitals guidelines.',
    shortExplanation: 'The main visual banner or headline takes too long to appear.',
    shortImpact: 'Slow loading frustrates mobile visitors and may increase bounce rates.',
    priorityReason: 'Page load speed is the first hurdle every visitor encounters; a sluggish start can prevent potential customers from seeing your services.',
    ownerTakeaway: 'Your main page content is taking too long to show up; streamlining images and scripts will help keep visitors engaged.',
    recommendedNextStep: 'Ask your developer or agency to compress header images and test the page with Google PageSpeed Insights.',
  },
  'lh.largest-contentful-paint': {
    whatIsWrong: 'The largest visible element on the page loads slowly, delaying when visitors can comfortably begin reading.',
    whyItMatters: 'Visitors expect fast visual feedback. A delayed main element creates the impression of an unoptimised website.',
    businessImpact: 'Potential customers on mobile devices may bounce before seeing your key value proposition or service highlights.',
    whatToDo: 'Optimise and preload the largest image or font file that appears above the fold.',
    whatIfIgnored: 'Your page will continue feeling slow on mobile devices, potentially depressing visitor retention.',
    shortExplanation: 'The largest visual element on the page loads slowly.',
    shortImpact: 'Delays when visitors can comfortably view your headline offer.',
    priorityReason: 'Core Web Vitals directly measure how fast visitors perceive your website to be.',
    ownerTakeaway: 'The biggest visual element needs faster delivery to give visitors an immediate first impression.',
    recommendedNextStep: 'Preload the top banner image and ensure image files are served in compressed modern formats.',
  },
  'lh.metric.total-blocking-time': {
    whatIsWrong: 'The website freezes or delays responding when visitors try to tap buttons, open menus, or click links during page load.',
    whyItMatters: 'Even if content looks visible, visitors become frustrated when clicking or tapping produces no immediate reaction.',
    businessImpact: 'Delays during user interactions can make the website feel sluggish and unresponsive, potentially reducing conversions from visitors attempting to click enquiry or booking buttons.',
    whatToDo: 'Audit third-party tracking scripts, widgets, and plugins, removing unnecessary ones and deferring non-essential code.',
    whatIfIgnored: 'Visitors may assume buttons are broken, mis-tap, or leave in frustration before completing forms or inquiries.',
    shortExplanation: 'The page temporarily freezes or ignores taps while background scripts load.',
    shortImpact: 'Visitors tapping buttons or menus may experience unresponsive delays.',
    priorityReason: 'An unresponsive interface prevents visitors from interacting with your contact routes and menus.',
    ownerTakeaway: 'Background scripts are causing brief freezes when visitors try to interact with your site.',
    recommendedNextStep: 'Ask your web team to clean up unused tracking tags and defer non-essential JavaScript.',
  },
  'lh.interactive': {
    whatIsWrong: 'The page takes a long time before visitors can smoothly interact with forms, buttons, and navigation.',
    whyItMatters: 'Visitors expect to tap or scroll right away; prolonged unresponsiveness damages trust and user patience.',
    businessImpact: 'Prospective clients who try to click a phone button or fill out a form may encounter lag, reducing enquiry conversion.',
    whatToDo: 'Reduce the volume of JavaScript executed during initial page load.',
    whatIfIgnored: 'Visitors will continue experiencing sluggish interaction on mobile phones.',
    shortExplanation: 'The page takes too long to become fully responsive to visitor taps.',
    shortImpact: 'Slow interactivity frustrates visitors who want to take immediate action.',
    priorityReason: 'Visitors expect seamless interaction the moment content appears on screen.',
    ownerTakeaway: 'Heavy page code is causing interactive delays for your visitors.',
    recommendedNextStep: 'Minimise heavy background scripts to ensure buttons respond without delay.',
  },
  'lh.metric.cumulative-layout-shift': {
    whatIsWrong: 'Elements on the page jump or shift unexpectedly while images, fonts, or banners finish loading in.',
    whyItMatters: 'Unexpected page movement causes visitors to lose their reading place or accidentally tap the wrong link or button.',
    businessImpact: 'Accidental taps irritate visitors and create a frustrating user experience, potentially leading prospective clients to abandon forms or booking steps.',
    whatToDo: 'Set explicit width and height dimensions on all images, banners, and video embeds so the browser reserves space beforehand.',
    whatIfIgnored: 'The website will continue feeling clunky to browse, and Google may downgrade mobile rankings due to poor page experience metrics.',
    shortExplanation: 'Page elements jump around while loading, causing accidental taps.',
    shortImpact: 'Content shifting irritates visitors and can trigger accidental clicks.',
    priorityReason: 'Layout shifts directly degrade usability on mobile phones, where screens are small and finger taps are common.',
    ownerTakeaway: 'Images and banners need fixed space reservations so text does not jump while visitors read.',
    recommendedNextStep: 'Ensure your web designer sets fixed width and height attributes on all images and containers.',
  },
  'lh.layout-shifts': {
    whatIsWrong: 'Content shifts position abruptly as late-loading resources pop onto the screen.',
    whyItMatters: 'Jumping text disrupts reading and causes accidental mis-taps on navigation and buttons.',
    businessImpact: 'Diminishes the perceived polish and professionalism of your business, leading some users to leave.',
    whatToDo: 'Reserve layout space for late-loading elements like ads, fonts, and images.',
    whatIfIgnored: 'Mobile visitors will continue to experience jarring jumps while browsing your services.',
    shortExplanation: 'Elements jump during loading as late assets appear.',
    shortImpact: 'Disrupts reading flow and leads to accidental clicks.',
    priorityReason: 'Stable visual presentation is essential for a professional user experience.',
    ownerTakeaway: 'Fixing shifting elements prevents visitors from accidentally clicking the wrong thing.',
    recommendedNextStep: 'Review which images lack dimensions and add CSS aspect ratios.',
  },
  'lh.metric.first-contentful-paint': {
    whatIsWrong: 'The first visible text or image takes too long to appear after someone opens the page.',
    whyItMatters: 'Visitors stare at a blank screen during the initial seconds, wondering if the website is actually working.',
    businessImpact: 'High initial latency encourages impatient visitors to press "back" and visit an alternative search result.',
    whatToDo: 'Improve server response time, enable compression, and remove render-blocking files.',
    whatIfIgnored: 'Initial page load remains sluggish, elevating early bounce rates.',
    shortExplanation: 'The first piece of content takes too long to show up on screen.',
    shortImpact: 'Visitors stare at a blank screen, increasing early bounce rates.',
    priorityReason: 'The first few seconds determine whether a visitor stays or immediately leaves.',
    ownerTakeaway: 'The website needs to show initial content faster to reassure visitors the page is working.',
    recommendedNextStep: 'Enable server compression and optimise delivery of core stylesheets.',
  },
  'lh.metric.speed-index': {
    whatIsWrong: 'The visible contents of the page fill in gradually rather than appearing smoothly and promptly.',
    whyItMatters: 'Visitors perceive the site as slow when visual components pop in piece by piece over several seconds.',
    businessImpact: 'Creates an impression of a dated or sluggish website, which can subtly dampen visitor confidence.',
    whatToDo: 'Prioritise critical styling and streamline images so visual presentation completes rapidly.',
    whatIfIgnored: 'Visitors experience a perceived lag whenever browsing between pages.',
    shortExplanation: 'Visual contents fill in gradually rather than appearing promptly.',
    shortImpact: 'Creates a sluggish perception that may discourage prolonged browsing.',
    priorityReason: 'Visual completeness directly influences how fast and responsive visitors feel your site is.',
    ownerTakeaway: 'Speeding up visual rendering will make the website feel much snappier.',
    recommendedNextStep: 'Optimize critical rendering paths and compress above-the-fold assets.',
  },
  'lh.render-blocking-resources': {
    whatIsWrong: 'Background stylesheet or script files prevent the browser from displaying anything until they finish downloading.',
    whyItMatters: 'The browser halts all visual rendering while waiting for these files, keeping visitors on a blank screen.',
    businessImpact: 'Delays the initial visual presentation, increasing bounce rates from search engines and paid advertising traffic.',
    whatToDo: 'Have your developer defer non-critical scripts (`defer` or `async`) and inline critical CSS.',
    whatIfIgnored: 'Your pages will continue suffering from an artificial delay before anything appears.',
    shortExplanation: 'Background code files block pages from displaying immediately.',
    shortImpact: 'Forces visitors to wait on a blank screen before seeing any content.',
    priorityReason: 'Render-blocking files delay everything else on the page from showing up.',
    ownerTakeaway: 'Code files are pausing the display of your website; deferring them will make pages show up sooner.',
    recommendedNextStep: 'Request your developer to add defer attributes to non-essential JavaScript files.',
  },
  'lh.unused-javascript': {
    whatIsWrong: 'The website downloads heavy script files containing code that is never actually executed on the page.',
    whyItMatters: 'Downloading and parsing unnecessary programming code wastes visitor data and slows down phone processors.',
    businessImpact: 'Pages consume extra mobile bandwidth and battery, making browsing feel sluggish on older or mobile devices.',
    whatToDo: 'Remove unneeded plugins, disabled widgets, or split script bundles so pages only load the code they need.',
    whatIfIgnored: 'The website remains bloated, slowing down every page visit across your site.',
    shortExplanation: 'The page loads script code that is not actually used on this page.',
    shortImpact: 'Wastes mobile data and slows down page processing on smartphones.',
    priorityReason: 'Unused code bloat is one of the most common causes of slow mobile performance.',
    ownerTakeaway: 'Removing unused plugins and code will lighten your website and speed up loading.',
    recommendedNextStep: 'Audit active WordPress or CMS plugins and deactivate those no longer in active use.',
  },
  'lh.unused-css-rules': {
    whatIsWrong: 'The website loads styling sheets containing design rules that do not apply to the current page.',
    whyItMatters: 'The browser must download and sift through hundreds of irrelevant style rules before painting the screen.',
    businessImpact: 'Adds unnecessary data download overhead, delaying page display especially on cellular connections.',
    whatToDo: 'Clean up unused styling frameworks or configure CSS purging in your build tool or caching plugin.',
    whatIfIgnored: 'Stylesheets remain heavier than necessary, adding drag to page rendering.',
    shortExplanation: 'The site downloads design styling rules that are not used on this page.',
    shortImpact: 'Adds unnecessary download weight before the page can display.',
    priorityReason: 'Clean styling delivery ensures pages render without unnecessary data overhead.',
    ownerTakeaway: 'Trimming unused design code helps pages load faster on mobile networks.',
    recommendedNextStep: 'Enable CSS minification and purging through your website caching system.',
  },
  'lh.modern-image-formats': {
    whatIsWrong: 'Images are saved in older file formats (like JPEG or PNG) instead of modern formats (like WebP or AVIF).',
    whyItMatters: 'Modern formats deliver identical visual quality at 25% to 50% smaller file sizes.',
    businessImpact: 'Heavier image files take longer to load over mobile networks, causing photo galleries or product images to load slowly.',
    whatToDo: 'Enable automated WebP image conversion in your CMS (such as via an image optimisation plugin or CDN).',
    whatIfIgnored: 'Your website will consume more visitor bandwidth and load photos noticeably slower than modern competitors.',
    shortExplanation: 'Images use older file formats that take up twice as much data as modern formats.',
    shortImpact: 'Photos and banners take longer to appear for mobile visitors.',
    priorityReason: 'Images typically represent over half of a website\'s download weight; converting formats is a high-impact fix.',
    ownerTakeaway: 'Converting photos to WebP format cuts file sizes in half with zero loss in visual quality.',
    recommendedNextStep: 'Install an image optimization plugin or ask your developer to convert images to WebP.',
  },
  'lh.uses-optimized-images': {
    whatIsWrong: 'Images on the website have larger file sizes than necessary and have not been compressed.',
    whyItMatters: 'Uncompressed photos waste visitor data and delay the display of key visual information.',
    businessImpact: 'Slow photo loading may cause prospective buyers to lose patience when reviewing products, past work, or team profiles.',
    whatToDo: 'Compress images before uploading or install an automated compression tool on your website.',
    whatIfIgnored: 'Pages will remain data-heavy, consuming excessive mobile data from your visitors.',
    shortExplanation: 'Image files are unnecessarily large and uncompressed.',
    shortImpact: 'Slows down page loading and uses excessive visitor data.',
    priorityReason: 'Unoptimised images directly inflate page download times across the website.',
    ownerTakeaway: 'Compressing images is a quick win that immediately speeds up page loading.',
    recommendedNextStep: 'Compress large photos using tools like TinyPNG or an automated CMS image plugin.',
  },
  'lh.offscreen-images': {
    whatIsWrong: 'Images far down the page are downloaded immediately on visit, even if the visitor never scrolls down to see them.',
    whyItMatters: 'Downloading images below the fold competes for bandwidth with the headline content at the top.',
    businessImpact: 'Wastes bandwidth and delays the appearance of the top of the page, where critical first impressions happen.',
    whatToDo: 'Enable "lazy loading" on images below the fold so they only download as the visitor scrolls down.',
    whatIfIgnored: 'Visitors must wait for unseen images to download before initial pages become fast and responsive.',
    shortExplanation: 'Images below the fold are loaded immediately instead of when scrolled into view.',
    shortImpact: 'Competes for bandwidth with the top banner, delaying first impressions.',
    priorityReason: 'Prioritising visible content ensures visitors see your primary message right away.',
    ownerTakeaway: 'Enabling lazy loading ensures visitors only download images they actually scroll to view.',
    recommendedNextStep: 'Add `loading="lazy"` to images located below the fold.',
  },
  'lh.total-byte-weight': {
    whatIsWrong: 'The total download weight of the page is very heavy, requiring visitors to transfer an excessive amount of data.',
    whyItMatters: 'Heavy pages load very slowly on mobile data connections and can run up data usage for visitors.',
    businessImpact: 'Mobile visitors on capped or slower networks may experience extreme delays or abandon the page entirely.',
    whatToDo: 'Reduce total page weight by compressing images, minifying scripts, and removing heavy unneeded media or embeds.',
    whatIfIgnored: 'The page will remain slow and expensive to load for mobile visitors.',
    shortExplanation: 'The total page download size is unusually heavy.',
    shortImpact: 'Causes high data usage and slow loading on mobile connections.',
    priorityReason: 'Heavy page size is the underlying root cause of sluggish mobile loading speeds.',
    ownerTakeaway: 'Trimming down total page weight will make the site significantly faster on phones.',
    recommendedNextStep: 'Review the heaviest assets on the page and compress or remove unnecessary files.',
  },
  'lh.server-response-time': {
    whatIsWrong: 'Your web hosting server takes too long to respond before it begins sending any webpage content.',
    whyItMatters: 'Everything else on the website is stalled while waiting for the hosting server\'s initial reply.',
    businessImpact: 'A sluggish server delays every single visitor and search bot, creating an unavoidable baseline delay across the entire site.',
    whatToDo: 'Enable page caching on your server or CMS, upgrade low-tier shared hosting, or implement a Content Delivery Network (CDN).',
    whatIfIgnored: 'Every page on your website will have an unavoidable delay before anything starts loading.',
    shortExplanation: 'The web hosting server responds slowly before sending page content.',
    shortImpact: 'Delays every single visit right from the start, slowing down the whole site.',
    priorityReason: 'Server delay is a bottleneck that affects every page and every visitor across your domain.',
    ownerTakeaway: 'Your hosting server is sluggish to reply; server caching or hosting upgrade will speed up every page.',
    recommendedNextStep: 'Enable full-page caching in your CMS or contact your hosting provider about server response time.',
  },
  'lh.document-latency-insight': {
    whatIsWrong: 'The hosting server takes a long time to deliver the initial HTML document to the browser.',
    whyItMatters: 'The browser cannot request styles, images, or scripts until the initial HTML document arrives.',
    businessImpact: 'Prolonged document latency makes the entire website feel sluggish to open, encouraging visitors to bounce early.',
    whatToDo: 'Review server processing times, database query speed, and enable page caching.',
    whatIfIgnored: 'Visitors will continue experiencing a pause before pages start rendering.',
    shortExplanation: 'The server takes too long to generate and deliver the initial webpage file.',
    shortImpact: 'Creates an unavoidable delay before anything on the page can begin loading.',
    priorityReason: 'Initial document delivery is the foundation upon which all other page loading depends.',
    ownerTakeaway: 'Server caching will allow your hosting server to deliver pages almost instantaneously.',
    recommendedNextStep: 'Implement page caching to serve pre-rendered pages directly from memory.',
  },
  'lh.unminified-javascript': {
    whatIsWrong: 'JavaScript files contain extra spaces, line breaks, and comments that make them larger than necessary.',
    whyItMatters: 'Unminified files take longer to transfer across mobile networks.',
    businessImpact: 'Slows down code delivery and increases data usage for prospective clients.',
    whatToDo: 'Enable JavaScript minification in your build pipeline or CMS caching plugin.',
    whatIfIgnored: 'Script files will remain slightly larger than necessary.',
    shortExplanation: 'Script code files contain unneeded spaces and formatting that increase file size.',
    shortImpact: 'Increases download times slightly for code files.',
    priorityReason: 'Minification is standard practice that easily shaves off unnecessary download weight.',
    ownerTakeaway: 'Minifying code files removes dead space and comments to speed up delivery.',
    recommendedNextStep: 'Turn on code minification in your caching or optimization plugin.',
  },
  'lh.unminified-css': {
    whatIsWrong: 'Stylesheet files contain unneeded formatting, whitespace, and comments.',
    whyItMatters: 'CSS files are render-blocking; extra file weight delays the moment pages can display.',
    businessImpact: 'Adds unnecessary milliseconds of delay before visitors can view your page design.',
    whatToDo: 'Enable CSS minification in your website settings or caching system.',
    whatIfIgnored: 'Stylesheets will take slightly longer to download than necessary.',
    shortExplanation: 'Design stylesheet files are not compressed and contain extra whitespace.',
    shortImpact: 'Slightly delays visual rendering on mobile networks.',
    priorityReason: 'Fast stylesheet delivery ensures visitors see styled content immediately.',
    ownerTakeaway: 'Minifying design files is a simple switch that speeds up initial styling.',
    recommendedNextStep: 'Enable CSS minification in your site settings.',
  },
  'lh.uses-text-compression': {
    whatIsWrong: 'Text-based files (HTML, CSS, JS) are not compressed using Gzip or Brotli before being sent across the web.',
    whyItMatters: 'Text compression typically reduces transfer sizes by 60% to 80% without any loss of quality.',
    businessImpact: 'Uncompressed files take much longer to download, particularly on cellular or mobile internet connections.',
    whatToDo: 'Enable Gzip or Brotli compression on your web server or through your CDN.',
    whatIfIgnored: 'Your website will transfer significantly more data than necessary on every visit.',
    shortExplanation: 'Webpage text files are sent without standard compression enabled.',
    shortImpact: 'Transfers 3x to 4x more data than necessary, slowing down loading.',
    priorityReason: 'Compression is a foundational web standard with immediate performance benefits.',
    ownerTakeaway: 'Enabling server compression cuts text download sizes by up to 70%.',
    recommendedNextStep: 'Ask your hosting provider to ensure Gzip or Brotli compression is active.',
  },
  'lh.uses-long-cache-ttl': {
    whatIsWrong: 'Static files (like logos, fonts, and images) do not tell browsers to save them locally for return visits.',
    whyItMatters: 'Without browser caching, return visitors must re-download unchanging files on every single page view.',
    businessImpact: 'Return visitors and clients browsing multiple pages experience slower transitions than necessary.',
    whatToDo: 'Configure browser caching headers (Cache-Control) to store static assets for up to one year.',
    whatIfIgnored: 'Returning customers will not benefit from instant page loads.',
    shortExplanation: 'The website does not instruct browsers to remember unchanging images and fonts.',
    shortImpact: 'Return visitors must re-download the same files over and over.',
    priorityReason: 'Proper caching makes repeat visits and multi-page browsing near-instantaneous.',
    ownerTakeaway: 'Enabling browser caching makes your site load instantly for returning visitors.',
    recommendedNextStep: 'Add browser caching rules in your web host control panel or CDN.',
  },
  'lh.errors-in-console': {
    whatIsWrong: 'The web browser encountered coding errors or failed file requests while loading the page.',
    whyItMatters: 'Console errors can mean interactive features (like sliders, popups, or form validations) are quietly failing.',
    businessImpact: 'Broken scripts may prevent visitors from submitting enquiry forms, clicking dropdown menus, or booking services.',
    whatToDo: 'Have your developer inspect the browser console, fix syntax errors, and remove broken third-party scripts.',
    whatIfIgnored: 'Certain interactive features on the site may fail for visitors without obvious warnings.',
    shortExplanation: 'The browser reported coding errors or failed requests while loading.',
    shortImpact: 'May indicate broken features such as enquiry forms or dropdown menus.',
    priorityReason: 'Console errors often signal broken functionality that directly impairs user journeys.',
    ownerTakeaway: 'Coding errors in the background may be quietly breaking forms or interactive features.',
    recommendedNextStep: 'Ask your developer to review the browser console and fix broken scripts.',
  },
  'lh.deprecations': {
    whatIsWrong: 'The website uses outdated browser programming features that modern web browsers are phasing out.',
    whyItMatters: 'Features that work today may stop functioning entirely in future browser updates.',
    businessImpact: 'Risks sudden breakage of website components as visitors update their Chrome, Safari, or Edge browsers.',
    whatToDo: 'Update older plugins, theme files, and JavaScript libraries to modern standards.',
    whatIfIgnored: 'Future browser updates may cause unexpected visual or functional glitches.',
    shortExplanation: 'The site uses outdated code features that modern browsers are discontinuing.',
    shortImpact: 'May cause future compatibility issues as visitors update their browsers.',
    priorityReason: 'Staying ahead of browser deprecations prevents sudden unexpected site failures.',
    ownerTakeaway: 'Updating older theme files and plugins will protect your site from future browser breakage.',
    recommendedNextStep: 'Update your website theme and plugins to their latest versions.',
  },
  'lh.inspector-issues': {
    whatIsWrong: 'The browser flagged technical warnings (such as cookie compliance or security flags) during loading.',
    whyItMatters: 'These warnings point to underlying configuration issues that may degrade user privacy or browser compatibility.',
    businessImpact: 'May lead to blocked features or privacy non-compliance on strict modern browsers.',
    whatToDo: 'Review the technical issues list in Chrome DevTools with your developer and resolve the flagged warnings.',
    whatIfIgnored: 'Underlying technical warnings may evolve into visible browser restrictions.',
    shortExplanation: 'The browser reported minor configuration or security warnings.',
    shortImpact: 'Points to underlying settings that need review by a developer.',
    priorityReason: 'Resolving browser warnings keeps the website healthy and compliant.',
    ownerTakeaway: 'A developer check will resolve these minor browser flags before they cause issues.',
    recommendedNextStep: 'Have your developer review the DevTools Issues panel during the next maintenance pass.',
  },
  'lh.third-party-cookies': {
    whatIsWrong: 'The website uses third-party cookies that are increasingly blocked by modern web browsers.',
    whyItMatters: 'Browsers like Chrome, Safari, and Firefox are phasing out third-party cookie tracking to protect user privacy.',
    businessImpact: 'External widgets, tracking pixels, or chat tools relying on these cookies may stop functioning reliably.',
    whatToDo: 'Review third-party tools (analytics, chat, ads) and transition to modern privacy-safe alternatives.',
    whatIfIgnored: 'Third-party tracking and integrations may become less reliable over time.',
    shortExplanation: 'Third-party cookies are in use, which modern browsers are restricting.',
    shortImpact: 'May affect tracking accuracy and external widget reliability.',
    priorityReason: 'Modern privacy standards require adapting away from third-party cookies.',
    ownerTakeaway: 'Review third-party tools to ensure they use modern, privacy-compliant tracking.',
    recommendedNextStep: 'Audit analytics and marketing tags to use first-party or server-side solutions.',
  },

  // =========================================================================
  // 2. Technical SEO & Crawl
  // =========================================================================
  'seo.start-page-error': {
    whatIsWrong: 'The main homepage returned a server error (such as 500 or 403) instead of loading normally.',
    whyItMatters: 'When the start page returns an error, neither human visitors nor search engine crawlers can view your website.',
    businessImpact: 'Completely halts inbound customer enquiries and will cause search engines to drop your website from results if not resolved immediately.',
    whatToDo: 'Contact your hosting provider or developer immediately to review server error logs and restore normal operation.',
    whatIfIgnored: 'Your website remains offline to the public, losing potential clients and search rankings.',
    shortExplanation: 'The homepage returned a server error instead of loading properly.',
    shortImpact: 'Blocks visitors and search engines from accessing your business online.',
    priorityReason: 'An unreachable start page is a critical blocker stopping all visitors and search engines.',
    ownerTakeaway: 'Your homepage is returning an error; urgent developer or hosting intervention is required.',
    recommendedNextStep: 'Contact your web host or developer immediately to resolve the server error.',
  },
  'lh.http-status-code': {
    whatIsWrong: 'Google\'s automated audit received an error status code when attempting to request the page.',
    whyItMatters: 'Pages that do not return a clean HTTP 200 success status cannot be reliably indexed by Google.',
    businessImpact: 'Prevents search engines from ranking the page and blocks prospective customers from viewing your content.',
    whatToDo: 'Fix server routing, permissions, or CMS errors so the URL consistently returns a valid HTTP 200 response.',
    whatIfIgnored: 'Search engines will exclude the erroring page from search results.',
    shortExplanation: 'The page returned an error status code to Google\'s test.',
    shortImpact: 'Prevents search engines from indexing and displaying this page.',
    priorityReason: 'Search engines require clean HTTP 200 status codes to rank any webpage.',
    ownerTakeaway: 'The page is throwing an error code; fixing the server route will restore search access.',
    recommendedNextStep: 'Check server error logs for this URL and restore a valid HTTP 200 response.',
  },
  'crawl.start-unreachable': {
    whatIsWrong: 'The audit crawler could not connect to your homepage directly, though Google\'s test could.',
    whyItMatters: 'May indicate aggressive bot-blocking firewalls, intermittent server timeouts, or regional hosting restrictions.',
    businessImpact: 'Search engine bots or legitimate business partners may occasionally encounter connection hurdles, slowing down indexing.',
    whatToDo: 'Check with your hosting or CDN provider (like Cloudflare) to ensure legitimate crawlers are not inadvertently blocked.',
    whatIfIgnored: 'Certain search engines or external tools may struggle to connect reliably.',
    shortExplanation: 'The audit could not establish a direct connection to your homepage.',
    shortImpact: 'May indicate server timeouts or overly strict firewall rules.',
    priorityReason: 'Reliable network connectivity is prerequisite for search indexing and customer visits.',
    ownerTakeaway: 'Your firewall or server may be intermittently blocking automated connection requests.',
    recommendedNextStep: 'Check firewall settings and verify website uptime monitoring.',
  },
  'crawl.start-refused': {
    whatIsWrong: 'The website explicitly refused the automated audit request, likely due to security or bot-protection settings.',
    whyItMatters: 'While security rules protect against spam, overly aggressive rules can inadvertently block legitimate search crawlers.',
    businessImpact: 'If search engine crawlers encounter similar blocks, your pages may not be crawled or updated in search results.',
    whatToDo: 'Confirm bot-protection settings with your web administrator and verify that major search engine user-agents are whitelisted.',
    whatIfIgnored: 'Search crawlers may be turned away when trying to index fresh content.',
    shortExplanation: 'The website refused automated connection requests.',
    shortImpact: 'Strict security settings may be turning away legitimate search crawlers.',
    priorityReason: 'Bot protection must allow legitimate search crawlers while keeping malicious bots out.',
    ownerTakeaway: 'Your website security blocked the audit; ensure search crawlers like Googlebot are permitted.',
    recommendedNextStep: 'Verify in your firewall or CDN settings that verified search bots are allowed.',
  },
  'crawl.error-pages': {
    whatIsWrong: 'One or more pages linked from your website return error screens (such as 404 Not Found or 500 Server Error).',
    whyItMatters: 'Visitors clicking internal links hit frustrating dead ends instead of finding the information they sought.',
    businessImpact: 'Dead ends break customer journeys, damage credibility, and lead potential clients to abandon the site rather than enquire.',
    whatToDo: 'Update the broken links to point to active pages, or configure 301 redirects to guide visitors to relevant active content.',
    whatIfIgnored: 'Visitors will continue stumbling into broken dead ends, wasting their time and eroding confidence.',
    shortExplanation: 'Several pages linked on your website lead to error screens.',
    shortImpact: 'Creates broken customer journeys and damages professional credibility.',
    priorityReason: 'Broken pages directly interrupt visitor journeys and waste search engine crawl budget.',
    ownerTakeaway: 'Internal links are leading visitors to error pages; redirecting them will fix the dead ends.',
    recommendedNextStep: 'Review the list of broken URLs and set up 301 redirects to active replacement pages.',
  },
  'crawl.client-rendered': {
    whatIsWrong: 'The website relies on browser JavaScript to build its content and links, rather than serving ready HTML.',
    whyItMatters: 'Search engine crawlers and slower devices may take longer or fail to see content that is generated purely via JavaScript.',
    businessImpact: 'Search engines might delay indexing or miss internal service links, potentially limiting organic search discoverability.',
    whatToDo: 'Consider server-side rendering (SSR) or pre-rendering key marketing and service pages so essential content exists in the initial HTML.',
    whatIfIgnored: 'Important page text and navigation links might not be indexed reliably by all search engines.',
    shortExplanation: 'Page content is built by browser scripts rather than ready HTML.',
    shortImpact: 'Search engines may take longer to index content or miss internal links.',
    priorityReason: 'Search engines prefer plain HTML; heavy client rendering can delay or hinder indexing.',
    ownerTakeaway: 'Your content is built dynamically by scripts; pre-rendering key pages will improve search visibility.',
    recommendedNextStep: 'Consult your developer about server-side rendering or pre-rendering for marketing pages.',
  },
  'crawl.truncated-pages': {
    whatIsWrong: 'Certain pages are unusually large in file size, causing automated tools to only inspect a portion of the code.',
    whyItMatters: 'Excessively large HTML files waste bandwidth and can slow down parsing for both browsers and search crawlers.',
    businessImpact: 'Content located near the bottom of bloated pages may be indexed slower by search engines.',
    whatToDo: 'Clean up bloated inline styles, heavy base64-encoded images, or excessive embedded scripts in the page source.',
    whatIfIgnored: 'Pages remain unusually heavy to download and inspect.',
    shortExplanation: 'Pages are unusually large, making full inspection difficult.',
    shortImpact: 'Excessive page size slows down parsing for browsers and search bots.',
    priorityReason: 'Clean, lean HTML ensures fast parsing and comprehensive search indexation.',
    ownerTakeaway: 'Pages contain excessive code weight; trimming inline data will speed them up.',
    recommendedNextStep: 'Move large inline code and embedded images into external cached files.',
  },
  'seo.redirect-chain': {
    whatIsWrong: 'A web address passes through multiple successive redirects before finally reaching the destination page.',
    whyItMatters: 'Each redirect in the chain adds an extra network round-trip, noticeably delaying page access.',
    businessImpact: 'Unnecessary redirect latency frustrates mobile visitors and dilutes the ranking authority passed to the final page.',
    whatToDo: 'Update internal links and server rules so visitors and search bots reach the final URL in a single direct hop.',
    whatIfIgnored: 'Pages will continue to load with unnecessary added delay, and search engines waste crawl budget.',
    shortExplanation: 'Visitors and search bots pass through multiple redirects before reaching pages.',
    shortImpact: 'Adds unnecessary loading delay before the page can display.',
    priorityReason: 'Redirect chains introduce avoidable delay on every visit.',
    ownerTakeaway: 'Links are hopping through multiple steps; updating them to direct links speeds up access.',
    recommendedNextStep: 'Update internal links to point directly to the final destination URL.',
  },
  'seo.canonical-invalid': {
    whatIsWrong: 'The canonical link tag exists but contains an invalid or malformed web address.',
    whyItMatters: 'Search engines rely on canonical tags to know which page URL is the authoritative master copy.',
    businessImpact: 'When canonical tags are invalid, search engines ignore them, potentially indexing duplicate or unwanted URL variations.',
    whatToDo: 'Correct the canonical tag so it contains a complete, valid `https://` address for the page.',
    whatIfIgnored: 'Search engines may split ranking authority across multiple URL versions.',
    shortExplanation: 'The canonical tag contains an invalid web address.',
    shortImpact: 'Search engines may ignore the tag and become confused about the primary URL.',
    priorityReason: 'Canonical tags ensure search engines direct all ranking power to your preferred page URL.',
    ownerTakeaway: 'The canonical address has a syntax error; fixing it consolidates your search rankings.',
    recommendedNextStep: 'Ensure your CMS or SEO plugin outputs a valid absolute HTTPS canonical URL.',
  },
  'seo.canonical-multiple': {
    whatIsWrong: 'The page declares more than one canonical tag with conflicting URL addresses.',
    whyItMatters: 'Conflicting instructions cause search engines to distrust and ignore all canonical directives on the page.',
    businessImpact: 'Can lead to unpredictable URL indexing, where search engines display an older or unwanted version of your page in results.',
    whatToDo: 'Ensure each page outputs exactly one canonical link tag in its `<head>` section.',
    whatIfIgnored: 'Search engines will decide which URL version to rank on their own, ignoring your preferences.',
    shortExplanation: 'The page contains multiple conflicting canonical tags.',
    shortImpact: 'Search engines may disregard canonical directions entirely.',
    priorityReason: 'Conflicting canonical tags defeat the purpose of URL consolidation.',
    ownerTakeaway: 'Duplicate canonical tags confuse search engines; ensure only one tag exists per page.',
    recommendedNextStep: 'Remove duplicate SEO plugins or template code producing multiple canonical tags.',
  },
  'seo.canonical-cross-domain': {
    whatIsWrong: 'The canonical tag points to an entirely different website domain.',
    whyItMatters: 'This tells Google that the "real" authoritative version of this page lives on another website.',
    businessImpact: 'If unintentional (such as from a staging site migration), this can cause Google to assign your search ranking credit to the other domain.',
    whatToDo: 'Verify whether cross-domain syndication is intended; if not, update the tag to your own website domain.',
    whatIfIgnored: 'Your pages may surrender search ranking authority to an external domain.',
    shortExplanation: 'The canonical tag points to an external website domain.',
    shortImpact: 'May give away search ranking credit to another website.',
    priorityReason: 'An incorrect cross-domain canonical can strip ranking authority from your own site.',
    ownerTakeaway: 'The page says another domain is the master copy; verify if this was an accidental leftover.',
    recommendedNextStep: 'Confirm with your team whether the canonical tag should point to your own domain.',
  },
  'seo.canonical-missing': {
    whatIsWrong: 'The page does not declare a canonical tag indicating its preferred address.',
    whyItMatters: 'Without a canonical tag, search engines treat variations (like `www`, non-`www`, trailing slashes, or query parameters) as duplicates.',
    businessImpact: 'Ranking signals may be diluted across competing URL variations of your own pages.',
    whatToDo: 'Add a self-referencing canonical tag pointing to the clean `https://` address of each page.',
    whatIfIgnored: 'Search engines may index duplicate URL variations of the same content.',
    shortExplanation: 'The page does not declare a preferred master URL.',
    shortImpact: 'URL parameters and tracking tags could create duplicate search listings.',
    priorityReason: 'Canonical tags protect against duplicate content penalties and URL confusion.',
    ownerTakeaway: 'Adding self-referencing canonical tags prevents search engines from indexing duplicate URL copies.',
    recommendedNextStep: 'Configure your SEO plugin to output self-referencing canonical tags automatically.',
  },
  'lh.canonical': {
    whatIsWrong: 'Google\'s audit flagged the canonical tag as invalid or conflicting.',
    whyItMatters: 'Search engines require clean canonical directives to understand which URL to index.',
    businessImpact: 'Can cause search engines to index the wrong URL or split search ranking authority.',
    whatToDo: 'Point the canonical tag directly to the page\'s own preferred `https://` URL.',
    whatIfIgnored: 'Search rankings may be fragmented across multiple URL versions.',
    shortExplanation: 'The canonical tag is conflicting or improperly configured.',
    shortImpact: 'May split search ranking signals across multiple URLs.',
    priorityReason: 'A clean canonical tag ensures your preferred URL ranks in search results.',
    ownerTakeaway: 'Fixing the canonical tag ensures Google ranks your preferred webpage URL.',
    recommendedNextStep: 'Set the canonical link to the exact preferred HTTPS address.',
  },
  'lh.crawlable-anchors': {
    whatIsWrong: 'Some links use JavaScript click handlers rather than standard hyperlink addresses (`<a href="...">`).',
    whyItMatters: 'Automated search engine crawlers do not execute JavaScript clicks to uncover new pages.',
    businessImpact: 'Valuable service or product pages may remain undiscovered by search engines if they cannot be reached via standard links.',
    whatToDo: 'Replace script-based click handlers with standard HTML links pointing to real URLs.',
    whatIfIgnored: 'Search engines will struggle to discover and rank the unlinked pages.',
    shortExplanation: 'Some links cannot be followed by automated search crawlers.',
    shortImpact: 'Search engines may miss linked pages on your website.',
    priorityReason: 'Standard links are the highway search engines use to navigate and index your site.',
    ownerTakeaway: 'Links need standard web addresses so search bots can follow them to your other pages.',
    recommendedNextStep: 'Replace JavaScript `onclick` buttons with standard HTML `<a href="...">` links.',
  },
  'lh.hreflang': {
    whatIsWrong: 'Language and regional targeting tags (hreflang) contain errors or broken URLs.',
    whyItMatters: 'Hreflang tags tell search engines which language version of a page to show to visitors in different countries.',
    businessImpact: 'Visitors in different regions may be shown the wrong language version in international search results.',
    whatToDo: 'Correct language codes (e.g. `en`, `hi`) and ensure all reciprocal hreflang links exist and return HTTP 200.',
    whatIfIgnored: 'Search engines will ignore the tags and may serve incorrect language versions.',
    shortExplanation: 'Language targeting tags contain errors or broken links.',
    shortImpact: 'Search engines may display the wrong language version in search results.',
    priorityReason: 'Correct hreflang ensures international or multilingual visitors see the right content.',
    ownerTakeaway: 'Language alternate tags have errors; correcting them ensures visitors get the right language.',
    recommendedNextStep: 'Verify language codes and ensure all hreflang URLs point to working pages.',
  },

  // =========================================================================
  // 3. Search Visibility & Indexing
  // =========================================================================
  'seo.noindex-start': {
    whatIsWrong: 'The homepage contains a "noindex" tag, explicitly instructing search engines not to show it in search results.',
    whyItMatters: 'This acts like a "keep out" sign for search engines. Google will obey this tag and hide your homepage from search listings.',
    businessImpact: 'Your business will not appear in Google searches for your company name or services, cutting off inbound organic search leads.',
    whatToDo: 'Remove the "noindex" directive immediately in your CMS or SEO plugin, then request re-indexing in Google Search Console.',
    whatIfIgnored: 'Your website will remain completely invisible in Google search results.',
    shortExplanation: 'The homepage tells Google not to show it in search results.',
    shortImpact: 'Completely prevents your website from appearing in Google search results.',
    priorityReason: 'A noindex tag on your homepage blocks all organic search discovery for your business.',
    ownerTakeaway: 'Your homepage is telling Google not to list it; removing this tag will restore search visibility.',
    recommendedNextStep: 'Remove the noindex tag from your homepage settings and request indexing in Google Search Console.',
  },
  'lh.is-crawlable': {
    whatIsWrong: 'Google\'s audit detected that the page is blocked from being indexed by search engines.',
    whyItMatters: 'Search engines are instructed not to include this page in search results.',
    businessImpact: 'Prospective clients searching for your products or services will not find this page on Google.',
    whatToDo: 'Remove any accidental `noindex` tags or `robots.txt` disallow rules on public pages.',
    whatIfIgnored: 'The page will stay absent from search engine results.',
    shortExplanation: 'Search engines are instructed not to index this page.',
    shortImpact: 'Prevents the page from appearing in search engine queries.',
    priorityReason: 'Crawlability is the absolute prerequisite for any search visibility.',
    ownerTakeaway: 'The page has an indexing block; removing it is required for Google to show it.',
    recommendedNextStep: 'Check page SEO settings and remove any "noindex" directive.',
  },
  'seo.noindex-pages': {
    whatIsWrong: 'Certain pages on your website carry a "noindex" tag instructing search engines to hide them from results.',
    whyItMatters: 'While appropriate for private thank-you or account pages, applying it to public pages hides valuable content.',
    businessImpact: 'If service or product pages are hidden by mistake, potential customers searching online will not discover them.',
    whatToDo: 'Review the listed pages with your team; remove the noindex setting from any pages meant to attract visitors.',
    whatIfIgnored: 'Those pages will remain undiscoverable through search engines.',
    shortExplanation: 'Certain pages are configured to stay hidden from Google.',
    shortImpact: 'Potential customers searching for those services will not find those pages.',
    priorityReason: 'Accidental noindex tags quietly starve important service pages of search traffic.',
    ownerTakeaway: 'Confirm whether the listed pages should be hidden; remove the tag if they are public services.',
    recommendedNextStep: 'Check the listed pages and remove noindex if they should attract search visitors.',
  },
  'seo.robots-blocks-all': {
    whatIsWrong: 'The website\'s `robots.txt` configuration file instructs all search engines to stay away from the entire website.',
    whyItMatters: 'Search engines check `robots.txt` before crawling; a blanket block tells them they are not permitted to inspect any pages.',
    businessImpact: 'Search visibility across your entire domain will stall or drop because crawlers are forbidden from reviewing your content.',
    whatToDo: 'Update `robots.txt` to remove blanket `Disallow: /` rules, allowing search engines to crawl public marketing pages.',
    whatIfIgnored: 'Search engines cannot crawl your pages, drastically reducing your search presence.',
    shortExplanation: 'Your robots.txt file blocks search engines from crawling the website.',
    shortImpact: 'Prevents search engines from reading and ranking your public pages.',
    priorityReason: 'A blanket crawler block prevents search engines from indexing the site, causing severe loss of organic search traffic.',
    ownerTakeaway: 'Your robots.txt file is turning search engines away; updating it restores crawler access.',
    recommendedNextStep: 'Edit `/robots.txt` to allow search engines to crawl public pages.',
  },
  'lh.robots-txt': {
    whatIsWrong: 'Google\'s audit detected syntax errors or issues in your `robots.txt` file.',
    whyItMatters: 'Invalid syntax can cause search engines to misinterpret crawler instructions or ignore sitemaps.',
    businessImpact: 'May cause search engines to crawl restricted areas or avoid crawling legitimate public pages.',
    whatToDo: 'Correct formatting errors in `robots.txt` and validate the file in Google Search Console.',
    whatIfIgnored: 'Search crawlers may behave unpredictably across your domain.',
    shortExplanation: 'The robots.txt file contains formatting errors.',
    shortImpact: 'May cause search engines to misinterpret crawling rules.',
    priorityReason: 'A valid robots.txt ensures search engines crawl the right pages smoothly.',
    ownerTakeaway: 'Fixing syntax errors in robots.txt ensures search crawlers understand your site rules.',
    recommendedNextStep: 'Validate your robots.txt file in Google Search Console and fix syntax errors.',
  },
  'seo.robots-unavailable': {
    whatIsWrong: 'The `robots.txt` file could not be retrieved consistently by the audit crawler.',
    whyItMatters: 'If `robots.txt` returns server errors or times out, cautious search engines may pause crawling your site.',
    businessImpact: 'Intermittent crawler access can slow down how quickly new pages and updates appear in search results.',
    whatToDo: 'Ensure `/robots.txt` returns a reliable HTTP 200 (or clean 404) without timing out.',
    whatIfIgnored: 'Search engine bots may delay crawling your site during server hiccups.',
    shortExplanation: 'The robots.txt file could not be retrieved reliably.',
    shortImpact: 'May cause search engines to pause crawling while waiting for the file.',
    priorityReason: 'Search engines check robots.txt before every crawl; it must be reliably available.',
    ownerTakeaway: 'Your robots.txt file is timing out; ensuring reliable delivery keeps crawlers happy.',
    recommendedNextStep: 'Verify your web server serves `/robots.txt` quickly and without intermittent errors.',
  },
  'seo.robots-missing': {
    whatIsWrong: 'The website does not have a `robots.txt` file.',
    whyItMatters: 'While not an error by itself, having one is the standard way to point search engines to your XML sitemap.',
    businessImpact: 'Search engines may take longer to discover your full sitemap and crawl all your pages.',
    whatToDo: 'Create a simple `robots.txt` file that allows crawling and announces your sitemap location.',
    whatIfIgnored: 'You miss the opportunity to guide search engine crawlers efficiently.',
    shortExplanation: 'No robots.txt file was found at the root of the site.',
    shortImpact: 'Misses the chance to announce your sitemap directly to crawlers.',
    priorityReason: 'A basic robots.txt file provides clean instructions for search crawlers.',
    ownerTakeaway: 'Adding a robots.txt file gives search engines a clear path to your sitemap.',
    recommendedNextStep: 'Create a basic robots.txt file pointing to your sitemap address.',
  },
  'seo.sitemap-not-found': {
    whatIsWrong: 'No XML sitemap was found at standard website addresses (such as `/sitemap.xml`).',
    whyItMatters: 'An XML sitemap is the official roadmap search engines use to discover and index all your pages.',
    businessImpact: 'Without a sitemap, search engines may take longer to discover new services, articles, or updates you publish.',
    whatToDo: 'Enable the sitemap feature in your CMS or SEO plugin, add its address to `robots.txt`, and submit it to Google Search Console.',
    whatIfIgnored: 'New or updated pages may take significantly longer to appear in search results.',
    shortExplanation: 'Search engines do not have a sitemap to discover all your pages.',
    shortImpact: 'Slower discovery and indexation of new or updated website content.',
    priorityReason: 'A sitemap is fundamental for ensuring search engines index all your important pages.',
    ownerTakeaway: 'Generating a sitemap ensures Google knows about every page on your website.',
    recommendedNextStep: 'Enable an XML sitemap in your CMS and submit it in Google Search Console.',
  },
  'seo.sitemap-invalid': {
    whatIsWrong: 'The XML sitemap contains formatting errors or broken page addresses.',
    whyItMatters: 'Search engines may fail to read the sitemap fully if syntax or links are corrupt.',
    businessImpact: 'Search engines may skip listed pages, delaying their indexation.',
    whatToDo: 'Regenerate the sitemap using a validated CMS plugin and check the Sitemaps report in Google Search Console.',
    whatIfIgnored: 'Search crawlers will continue encountering errors when processing your sitemap.',
    shortExplanation: 'The XML sitemap contains syntax errors or invalid page links.',
    shortImpact: 'Prevents search engines from reading your page list smoothly.',
    priorityReason: 'A clean sitemap ensures search engines read your URL roadmap without error.',
    ownerTakeaway: 'The sitemap has formatting errors; regenerating it will restore clean crawler access.',
    recommendedNextStep: 'Regenerate the sitemap and test it in Google Search Console.',
  },
  'seo.sitemap-not-in-robots': {
    whatIsWrong: 'The sitemap exists, but your `robots.txt` file does not announce its web address.',
    whyItMatters: 'Declaring `Sitemap: https://...` in `robots.txt` is how search engines automatically discover your sitemap.',
    businessImpact: 'Search crawlers may take longer to locate your sitemap if it is not explicitly announced.',
    whatToDo: 'Add a single `Sitemap: https://yourdomain.com/sitemap.xml` line to your `robots.txt` file.',
    whatIfIgnored: 'Search engines must rely on manual discovery or Search Console submissions.',
    shortExplanation: 'Your robots.txt file does not mention where your sitemap is located.',
    shortImpact: 'Search bots must guess or rely on manual submission to find your sitemap.',
    priorityReason: 'Declaring your sitemap in robots.txt is a standard, effortless best practice.',
    ownerTakeaway: 'Adding your sitemap URL to robots.txt ensures all crawlers find your page list automatically.',
    recommendedNextStep: 'Add `Sitemap: [your-sitemap-url]` to your robots.txt file.',
  },
  'seo.missing-title': {
    whatIsWrong: 'One or more pages lack an HTML `<title>` tag.',
    whyItMatters: 'The title tag generates the clickable headline in Google search results and browser tabs.',
    businessImpact: 'Without a title, Google must invent a headline for your page, which may look confusing or unprofessional to prospective customers browsing search results.',
    whatToDo: 'Write a concise, descriptive title (about 50 to 60 characters) for each page, featuring the service name and location or brand.',
    whatIfIgnored: 'Search listings will look incomplete, reducing click-through rates from search results.',
    shortExplanation: 'The page is missing the headline that search engines show in results.',
    shortImpact: 'Search results may display unclear headlines, discouraging clicks from prospective clients.',
    priorityReason: 'The title tag is one of the most important on-page SEO signals for ranking and click appeal.',
    ownerTakeaway: 'The page is missing a headline for Google results; adding one will improve search clicks.',
    recommendedNextStep: 'Add a clear, unique title tag in your CMS page settings.',
  },
  'lh.document-title': {
    whatIsWrong: 'Google\'s audit found that the page has no document title.',
    whyItMatters: 'Search engines and browser tabs rely on the document title to communicate what the page is about.',
    businessImpact: 'Search engines will struggle to rank the page properly, and users cannot easily identify the tab.',
    whatToDo: 'Add a unique, descriptive `<title>` tag in the page settings of your CMS.',
    whatIfIgnored: 'The page will lack a proper headline in search results and browser tabs.',
    shortExplanation: 'The webpage has no document title specified.',
    shortImpact: 'Search engines cannot identify the main topic of the page.',
    priorityReason: 'A page without a title is missing the basic foundation of web identity.',
    ownerTakeaway: 'Adding a title tag is essential for Google to understand and display your page.',
    recommendedNextStep: 'Write a unique 50-60 character title for the page in your CMS.',
  },
  'seo.title-length': {
    whatIsWrong: 'Page titles are either very short or too long (exceeding roughly 65 characters).',
    whyItMatters: 'Titles that are too long get cut off with ellipses (...) in Google search results; titles that are too short miss valuable search keywords.',
    businessImpact: 'Truncated or vague titles look less compelling in search results, reducing the rate at which searchers click your link.',
    whatToDo: 'Adjust titles to roughly 50 to 60 characters, keeping the most important keywords and business name near the beginning.',
    whatIfIgnored: 'Search listings will look cut off or incomplete on mobile and desktop search screens.',
    shortExplanation: 'Page titles are too short or cut off in Google search results.',
    shortImpact: 'Search listings look less compelling, reducing click-through rates.',
    priorityReason: 'Properly sized titles maximize click-through rates from search engine results.',
    ownerTakeaway: 'Adjusting title length ensures your full headline shows cleanly in Google results.',
    recommendedNextStep: 'Edit page titles to be 50-60 characters, with key services listed first.',
  },
  'seo.multiple-titles': {
    whatIsWrong: 'The page contains more than one `<title>` tag in its code, usually due to a template or plugin conflict.',
    whyItMatters: 'Search engines may choose the wrong title to display in search results.',
    businessImpact: 'Can cause unpredictable headlines in Google results, potentially showing placeholder text instead of your intended title.',
    whatToDo: 'Clean up header templates or conflicting SEO plugins so only one title tag is generated.',
    whatIfIgnored: 'Search engines will guess which title to show, risking unhelpful search snippets.',
    shortExplanation: 'Multiple title tags exist on the page, confusing search engines.',
    shortImpact: 'Google may display the wrong headline in search listings.',
    priorityReason: 'Clean code ensures search engines display exactly the headline you intended.',
    ownerTakeaway: 'Conflicting plugins are outputting two titles; keeping only one fixes search headlines.',
    recommendedNextStep: 'Remove duplicate title tags from your theme header or SEO plugin.',
  },
  'seo.duplicate-titles': {
    whatIsWrong: 'Several inspected pages share the exact same title tag.',
    whyItMatters: 'Duplicate titles make it hard for both search engines and human searchers to tell pages apart.',
    businessImpact: 'Your own pages compete against each other in search results, confusing Google about which page to rank for specific services.',
    whatToDo: 'Give every page its own unique title that clearly describes its specific service or topic.',
    whatIfIgnored: 'Pages will cannibalize each other\'s search rankings and confuse searchers.',
    shortExplanation: 'Multiple pages share identical title headlines in search results.',
    shortImpact: 'Pages compete against each other instead of ranking for distinct queries.',
    priorityReason: 'Unique titles ensure each service page ranks for its own specific search terms.',
    ownerTakeaway: 'Giving each page a distinct title helps customers and Google tell them apart.',
    recommendedNextStep: 'Write a unique, specific title for each listed page.',
  },
  'seo.missing-description': {
    whatIsWrong: 'One or more pages lack a meta description summary.',
    whyItMatters: 'The meta description generates the two-line preview snippet displayed under your headline in Google search results.',
    businessImpact: 'Without a custom description, Google extracts random text fragments from the page, which may look disjointed and reduce click appeal.',
    whatToDo: 'Write an engaging 1-to-2 sentence summary (roughly 120 to 155 characters) for each page explaining the benefit and inviting visitors to click.',
    whatIfIgnored: 'Search snippets will show automated text scraps instead of a clear summary of your offer.',
    shortExplanation: 'Pages lack a tailored preview summary for search engine results.',
    shortImpact: 'Search snippets may show random text instead of a clear summary of your offer.',
    priorityReason: 'A compelling description directly increases the percentage of searchers who click your website.',
    ownerTakeaway: 'Writing custom descriptions gives you control over what searchers read before clicking.',
    recommendedNextStep: 'Add a 1-2 sentence meta description for each page in your CMS.',
  },
  'lh.meta-description': {
    whatIsWrong: 'Google\'s audit found that the page has no meta description.',
    whyItMatters: 'The meta description is the pitch that convinces searchers to choose your link over competitors.',
    businessImpact: 'Searchers may skip your listing in favor of competitors who show clear, inviting descriptions.',
    whatToDo: 'Add a unique, compelling meta description to the page settings in your CMS.',
    whatIfIgnored: 'Google will auto-generate snippet text that may not highlight your strongest selling points.',
    shortExplanation: 'The page has no meta description summary.',
    shortImpact: 'Search listings may look unpolished or generic.',
    priorityReason: 'The meta description is your free advertising copy in Google search results.',
    ownerTakeaway: 'Adding a meta description lets you craft the exact snippet shown in Google.',
    recommendedNextStep: 'Write a compelling 150-character summary of the page.',
  },
  'seo.description-length': {
    whatIsWrong: 'Meta descriptions are either very short or too long, risking truncation in search snippets.',
    whyItMatters: 'Descriptions over roughly 160 characters get cut off with ellipses (...); descriptions under 50 characters fail to explain the page.',
    businessImpact: 'Incomplete descriptions communicate less effectively to prospective customers reviewing search results.',
    whatToDo: 'Keep meta descriptions between roughly 120 and 155 characters for optimal display across mobile and desktop screens.',
    whatIfIgnored: 'Snippets will look truncated or incomplete in search engine results.',
    shortExplanation: 'Meta descriptions are too short or cut off in search snippets.',
    shortImpact: 'Snippet text may be truncated, reducing click appeal.',
    priorityReason: 'Well-crafted snippet lengths ensure your complete message is read by searchers.',
    ownerTakeaway: 'Adjusting description length ensures your full marketing snippet is visible in Google.',
    recommendedNextStep: 'Trim or expand descriptions to fit the 120-155 character sweet spot.',
  },
  'seo.duplicate-descriptions': {
    whatIsWrong: 'Several inspected pages share the exact same meta description.',
    whyItMatters: 'Identical descriptions make different service pages look like duplicates in search results.',
    businessImpact: 'Prospective clients comparing your listings cannot distinguish between different services, reducing click engagement.',
    whatToDo: 'Write a distinct description for each page highlighting that specific offering.',
    whatIfIgnored: 'Search listings will look repetitive across different queries.',
    shortExplanation: 'Multiple pages share identical meta description summaries.',
    shortImpact: 'Makes different service pages look identical in search results.',
    priorityReason: 'Unique descriptions help searchers understand which page meets their specific need.',
    ownerTakeaway: 'Giving each page its own description helps searchers pick the right service.',
    recommendedNextStep: 'Write tailored descriptions for each page reflecting its unique topic.',
  },
  'seo.missing-h1': {
    whatIsWrong: 'The page lacks a primary Heading 1 (`<h1>`) headline.',
    whyItMatters: 'The H1 is the primary headline that confirms to visitors and search engines what the page is about.',
    businessImpact: 'Without a clear main heading, visitors may feel disoriented upon landing, wondering if they reached the right page.',
    whatToDo: 'Add one clear H1 heading near the top of the page stating the core service, product, or topic.',
    whatIfIgnored: 'Page structure remains less clear for search engines and first-time visitors.',
    shortExplanation: 'The page lacks a clear main headline confirming its topic.',
    shortImpact: 'Visitors and search engines have less clarity on the core topic of the page.',
    priorityReason: 'The H1 heading anchors the page content and establishes immediate topical clarity.',
    ownerTakeaway: 'Adding a clear H1 headline reassures visitors they landed in the right place.',
    recommendedNextStep: 'Make the main title of each page a Heading 1 (H1) in your editor.',
  },
  'seo.multiple-h1': {
    whatIsWrong: 'The page contains multiple H1 headings competing for prominence.',
    whyItMatters: 'While allowed by web standards, having several H1 headings can dilute topical focus.',
    businessImpact: 'Can make it slightly harder for search engines to determine which headline represents the primary topic.',
    whatToDo: 'Keep one primary H1 heading for the page title, and use H2 and H3 headings for sub-sections.',
    whatIfIgnored: 'Visual and topical hierarchy remains slightly muddled.',
    shortExplanation: 'The page has several H1 headings instead of one clear main title.',
    shortImpact: 'Hierarchy is less clear than having one H1 with H2 subheadings.',
    priorityReason: 'A clean heading structure helps readers scan content and helps search engines parse topics.',
    ownerTakeaway: 'Using one H1 for the page title and H2s for sections creates clean reading structure.',
    recommendedNextStep: 'Change secondary H1 headings to H2 section headers.',
  },
  'seo.thin-content': {
    whatIsWrong: 'Inspected pages contain very little descriptive text or explanation in their HTML.',
    whyItMatters: 'Search engines and prospective customers look for enough detail to understand what you offer and why they should choose you.',
    businessImpact: 'Pages with minimal information struggle to rank for relevant search terms and often fail to convince visitors to get in touch.',
    whatToDo: 'Expand key service pages with clear descriptions, benefits, common customer questions, and reassurance.',
    whatIfIgnored: 'The page may not provide enough context to rank well or convert interested visitors into leads.',
    shortExplanation: 'The page contains very little text explaining what you offer.',
    shortImpact: 'Harder for search engines to rank and less informative for prospective clients.',
    priorityReason: 'Comprehensive content is essential for answering customer questions and ranking in search.',
    ownerTakeaway: 'Adding helpful details about your services will help both visitors and search engines.',
    recommendedNextStep: 'Expand the page text with service details, benefits, and common customer questions.',
  },
  'seo.no-structured-data': {
    whatIsWrong: 'The website does not include structured data (Schema markup) describing your business details to search engines.',
    whyItMatters: 'Structured data translates your business name, address, phone number, and services into machine-readable format for Google.',
    businessImpact: 'Missing schema limits your chances of earning rich search enhancements (like star ratings, contact cards, or local business panels in Google).',
    whatToDo: 'Add LocalBusiness or Organization schema markup in JSON-LD format to your homepage with accurate business details.',
    whatIfIgnored: 'Your business misses out on rich snippet visual badges in Google search results.',
    shortExplanation: 'Search engines cannot read your business information in structured schema format.',
    shortImpact: 'Limits opportunities for enhanced Google search features like business cards or review stars.',
    priorityReason: 'Schema markup helps Google understand your business identity and showcase it prominently.',
    ownerTakeaway: 'Adding structured data helps Google display rich business details in search results.',
    recommendedNextStep: 'Add LocalBusiness JSON-LD structured data to your homepage via your SEO plugin.',
  },
  'seo.invalid-jsonld': {
    whatIsWrong: 'Structured data on the page contains syntax errors and cannot be parsed by search engines.',
    whyItMatters: 'When schema code is malformed, search engines ignore it entirely.',
    businessImpact: 'Any intended rich search snippets (like reviews, FAQs, or event badges) will fail to appear in search results.',
    whatToDo: 'Validate structured data using Google\'s Rich Results Test and fix syntax errors.',
    whatIfIgnored: 'Search engines will continue disregarding your structured business markup.',
    shortExplanation: 'Structured data markup contains code errors that search engines cannot read.',
    shortImpact: 'Prevents search engines from granting rich search snippet features.',
    priorityReason: 'Valid syntax is required for search engines to use your structured data.',
    ownerTakeaway: 'Fixing code errors in your schema markup will restore rich Google snippet eligibility.',
    recommendedNextStep: 'Test your page with Google\'s Rich Results Test tool and resolve code warnings.',
  },
  'seo.missing-open-graph': {
    whatIsWrong: 'Pages do not include Open Graph tags (social sharing preview metadata).',
    whyItMatters: 'When someone shares your link on WhatsApp, LinkedIn, or social media, these tags specify the preview image, title, and summary.',
    businessImpact: 'Without them, shared links may look blank, show random images, or appear unformatted, making your business look less professional in messaging apps.',
    whatToDo: 'Add Open Graph metadata (title, description, and share image) in your website header or SEO plugin.',
    whatIfIgnored: 'Links shared on WhatsApp and social media will look plain and less trustworthy.',
    shortExplanation: 'Links shared on WhatsApp or social media lack a custom preview image and summary.',
    shortImpact: 'Shared links look plain or broken when sent to prospective clients via messaging apps.',
    priorityReason: 'WhatsApp and social sharing are primary referral channels for modern businesses.',
    ownerTakeaway: 'Adding social share tags ensures your links look polished and professional in WhatsApp chats.',
    recommendedNextStep: 'Set an Open Graph share image and description in your CMS or SEO plugin.',
  },

  // =========================================================================
  // 4. Accessibility
  // =========================================================================
  'a11y.images-missing-alt': {
    whatIsWrong: 'Important images do not have descriptive alternative text ("alt text").',
    whyItMatters: 'Visitors using screen readers (such as people with visual impairments) cannot tell what the images depict.',
    businessImpact: 'Visually impaired customers face barriers to understanding your products or team, and search engines cannot read image content.',
    whatToDo: 'Add a brief, factual description of what each image shows inside your media library or website editor.',
    whatIfIgnored: 'The website remains harder to use for visitors with visual disabilities, and misses image search visibility.',
    shortExplanation: 'Images do not have written descriptions for screen-reading software.',
    shortImpact: 'People using assistive tools cannot understand visual content on your website.',
    priorityReason: 'Image descriptions are the most fundamental requirement of website accessibility.',
    ownerTakeaway: 'Adding short descriptions to images makes your site accessible and improves image search.',
    recommendedNextStep: 'Add short descriptive alt text to meaningful images in your media library.',
  },
  'lh.image-alt': {
    whatIsWrong: 'Google\'s audit flagged images that lack text descriptions for assistive technology.',
    whyItMatters: 'Assistive software announces blank filenames or skips images when alt text is missing.',
    businessImpact: 'Creates an inaccessible experience for screen reader users and misses visual search indexing.',
    whatToDo: 'Add descriptive alt text to meaningful photos, and use empty `alt=""` only for decorative graphics.',
    whatIfIgnored: 'Assistive users will miss visual information, and image search rankings will suffer.',
    shortExplanation: 'Some images have no text description for screen readers.',
    shortImpact: 'Assistive software users cannot understand the images.',
    priorityReason: 'Alternative text is essential for web accessibility and visual SEO.',
    ownerTakeaway: 'Adding alt text to photos ensures everyone can understand your visual content.',
    recommendedNextStep: 'Review flagged images and add descriptive alt text in your editor.',
  },
  'a11y.unlabeled-fields': {
    whatIsWrong: 'One or more form fields do not have visible, connected labels explaining what information to enter.',
    whyItMatters: 'Screen readers cannot announce the purpose of an unlabelled field, and placeholder text often disappears when typing begins.',
    businessImpact: 'Customers trying to fill out enquiry or booking forms may become confused, leading to abandoned inquiries.',
    whatToDo: 'Add visible `<label>` tags above or beside every form input (e.g., "Full Name", "Phone Number", "Email Address").',
    whatIfIgnored: 'Prospective clients using assistive software or mobile devices will struggle to complete forms.',
    shortExplanation: 'Form fields lack clear labels indicating what information to enter.',
    shortImpact: 'Makes completing enquiry or quote forms confusing, increasing form abandonment.',
    priorityReason: 'Forms are how customers reach you; unlabelled fields directly sabotage lead generation.',
    ownerTakeaway: 'Adding clear labels to every form box makes it easy for visitors to submit enquiries.',
    recommendedNextStep: 'Ensure every form input has a clear visible label attached to it.',
  },
  'lh.label': {
    whatIsWrong: 'Form input fields lack programmatic labels for assistive technology.',
    whyItMatters: 'Assistive software cannot announce what information belongs in the field.',
    businessImpact: 'Visitors with disabilities cannot reliably submit enquiries or contact requests.',
    whatToDo: 'Attach `<label for="...">` elements to every form field or provide `aria-label` attributes.',
    whatIfIgnored: 'Form fields will remain inaccessible to visitors using screen readers.',
    shortExplanation: 'Some form fields have no accessible label.',
    shortImpact: 'Prevents screen reader users from knowing what to type in forms.',
    priorityReason: 'Accessible forms ensure all potential customers can submit enquiries.',
    ownerTakeaway: 'Every form field needs an accessible label so anyone can reach out to you.',
    recommendedNextStep: 'Add proper label tags to all form inputs.',
  },
  'a11y.unnamed-buttons': {
    whatIsWrong: 'Interactive buttons lack text or labels describing what clicking them does.',
    whyItMatters: 'Screen readers announce them simply as "button" with no explanation of whether it submits, closes, or deletes.',
    businessImpact: 'Visitors using assistive technology cannot safely navigate your site or submit forms with confidence.',
    whatToDo: 'Ensure every button includes visible text or an `aria-label` describing the action (e.g., "Search", "Close menu", "Submit enquiry").',
    whatIfIgnored: 'Some visitors will be unable to interact with key buttons on your website.',
    shortExplanation: 'Buttons do not state what action they perform.',
    shortImpact: 'Confuses visitors using assistive tech and can block navigation or form submission.',
    priorityReason: 'Buttons must have clear names so visitors know what action they are triggering.',
    ownerTakeaway: 'Every button needs a clear name so visitors know what clicking it will do.',
    recommendedNextStep: 'Add visible text or `aria-label` attributes to icon-only buttons.',
  },
  'lh.button-name': {
    whatIsWrong: 'Google\'s audit flagged buttons that have no accessible name.',
    whyItMatters: 'Screen readers announce unlabelled buttons as generic "button", leaving users guessing.',
    businessImpact: 'Visitors relying on assistive tools cannot comfortably submit forms or navigate.',
    whatToDo: 'Add descriptive text or `aria-label` attributes to all interactive buttons.',
    whatIfIgnored: 'Buttons will remain confusing or unusable for assistive technology users.',
    shortExplanation: 'Interactive buttons have no accessible name for screen readers.',
    shortImpact: 'Leaves screen reader users guessing what buttons do.',
    priorityReason: 'Clear button naming is a core web accessibility standard.',
    ownerTakeaway: 'Labeling buttons ensures all visitors can interact with your site confidently.',
    recommendedNextStep: 'Add accessible names or labels to icon buttons.',
  },
  'a11y.unnamed-links': {
    whatIsWrong: 'Icon links or graphical buttons lack text explaining where they lead.',
    whyItMatters: 'Screen readers announce them as "link" without stating the destination URL or purpose.',
    businessImpact: 'Visitors using screen readers cannot tell where social icons or menu links lead.',
    whatToDo: 'Add descriptive text or an `aria-label` (e.g., "Follow us on Instagram", "Read our pricing guide").',
    whatIfIgnored: 'Icon links remain confusing for assistive technology users.',
    shortExplanation: 'Links or icons have no text explaining where they lead.',
    shortImpact: 'Screen reader users cannot tell what page the link opens.',
    priorityReason: 'Links must clearly communicate their destination to all visitors.',
    ownerTakeaway: 'Adding labels to icon links ensures screen readers announce where the link goes.',
    recommendedNextStep: 'Add `aria-label` attributes to icon links like social media icons.',
  },
  'lh.link-name': {
    whatIsWrong: 'Google\'s audit found links that have no accessible name or text.',
    whyItMatters: 'Assistive software cannot inform the user where the link points.',
    businessImpact: 'Degrades the browsing experience for visitors with visual disabilities.',
    whatToDo: 'Provide descriptive anchor text or an `aria-label` for every link.',
    whatIfIgnored: 'Links remain ambiguous for assistive users.',
    shortExplanation: 'Some links have no accessible name.',
    shortImpact: 'Makes link destinations unclear for assistive software users.',
    priorityReason: 'Every link must have an identifiable destination for accessibility.',
    ownerTakeaway: 'Ensuring every link has a name makes navigation accessible to everyone.',
    recommendedNextStep: 'Add descriptive text or labels to all links.',
  },
  'a11y.missing-lang': {
    whatIsWrong: 'The webpage code does not declare its primary language (e.g. `<html lang="en">`).',
    whyItMatters: 'Screen readers need to know the language so they can use the correct pronunciation rules and accent.',
    businessImpact: 'Visitors using speech synthesis may hear English text mispronounced using default foreign pronunciation rules.',
    whatToDo: 'Add a language attribute (such as `lang="en"` or `lang="hi"`) to the `<html>` tag in your site template.',
    whatIfIgnored: 'Automated translation tools and screen readers may guess the wrong language.',
    shortExplanation: 'The website does not declare its language in the page code.',
    shortImpact: 'Affects screen reader pronunciation and automated browser translation.',
    priorityReason: 'Declaring page language is a simple, universal requirement for web accessibility.',
    ownerTakeaway: 'Adding a language tag ensures screen readers and translation tools pronounce words correctly.',
    recommendedNextStep: 'Set the language setting in your CMS or add `lang="en"` to your template.',
  },
  'a11y.heading-skips': {
    whatIsWrong: 'Heading levels skip steps in sequence (such as jumping from an H1 directly to an H3 or H4).',
    whyItMatters: 'Screen reader users navigate pages by jumping between headings; skipping levels makes the document structure confusing.',
    businessImpact: 'Visitors using assistive tools may assume sections are missing or get lost in the hierarchy.',
    whatToDo: 'Organize headings in logical sequential order: H1 for the page title, H2 for major sections, H3 for sub-sections.',
    whatIfIgnored: 'The document outline remains irregular for assistive tools.',
    shortExplanation: 'Heading levels skip steps (e.g. jumping from H1 directly to H3).',
    shortImpact: 'Makes document structure harder to follow for assistive technology users.',
    priorityReason: 'Logical heading order helps both assistive readers and search bots understand content structure.',
    ownerTakeaway: 'Organizing headings in order (H1, then H2, then H3) creates clean page hierarchy.',
    recommendedNextStep: 'Adjust skipped heading tags to follow a logical numerical sequence.',
  },
  'lh.heading-order': {
    whatIsWrong: 'Headings on the page are not ordered logically.',
    whyItMatters: 'Visual heading styling should match underlying heading tag hierarchy.',
    businessImpact: 'Disrupts navigation for users who rely on heading shortcuts to scan content.',
    whatToDo: 'Ensure heading tags follow a sequential hierarchy (H1 -> H2 -> H3).',
    whatIfIgnored: 'Assistive software users may experience disoriented navigation.',
    shortExplanation: 'Headings do not follow a logical structural order.',
    shortImpact: 'Disrupts screen reader page navigation.',
    priorityReason: 'Sequential headings provide an intuitive outline of your page content.',
    ownerTakeaway: 'Fixing heading order creates a clear, professional document outline.',
    recommendedNextStep: 'Review heading tags and ensure they follow logical numerical order.',
  },
  'a11y.positive-tabindex': {
    whatIsWrong: 'Some elements use positive `tabindex` values, overriding the natural keyboard navigation flow.',
    whyItMatters: 'Keyboard users (who press Tab to jump between links and fields) experience erratic, confusing jumping across the page.',
    businessImpact: 'Visitors navigating by keyboard may find it impossible to reach enquiry forms or buttons in a sensible order.',
    whatToDo: 'Remove positive `tabindex` attributes, allowing elements to follow the natural reading order of the HTML.',
    whatIfIgnored: 'Keyboard navigation will remain frustrating and unpredictable.',
    shortExplanation: 'Elements jump out of natural order when pressing the Tab key.',
    shortImpact: 'Confuses visitors who navigate the website using a keyboard.',
    priorityReason: 'Keyboard accessibility is essential for visitors who cannot use a mouse.',
    ownerTakeaway: 'Removing manual tab numbers lets visitors navigate smoothly in natural reading order.',
    recommendedNextStep: 'Remove `tabindex="1"` or positive values from your template code.',
  },
  'lh.color-contrast': {
    whatIsWrong: 'The color of some text is too similar to the background color behind it.',
    whyItMatters: 'Low contrast makes text washed out and hard to read, especially in bright sunlight or for people with aging vision.',
    businessImpact: 'Visitors may struggle to read your pricing, guarantees, or contact information, leading them to leave the site.',
    whatToDo: 'Darken light gray text on white backgrounds or lighten text on dark backgrounds to meet standard contrast guidelines.',
    whatIfIgnored: 'Visitors in outdoor settings or with visual fatigue will find your website tiring to read.',
    shortExplanation: 'Text color blends into the background, making words hard to read.',
    shortImpact: 'Makes key details difficult to read, especially on mobile screens outdoors.',
    priorityReason: 'Readable contrast is fundamental for all visitors reading your offer.',
    ownerTakeaway: 'Darkening text colors makes your words easy to read for everyone, including outdoors.',
    recommendedNextStep: 'Adjust text colors to have strong contrast against their backgrounds.',
  },
  'a11y.zoom-disabled': {
    whatIsWrong: 'The website disables pinch-to-zoom on mobile devices.',
    whyItMatters: 'People with partial sight or small phone screens cannot magnify text or images to read comfortably.',
    businessImpact: 'Frustrated mobile users who cannot enlarge small print may abandon the site rather than struggle to read.',
    whatToDo: 'Remove `user-scalable=no` from your viewport tag so visitors can freely zoom when needed.',
    whatIfIgnored: 'Visitors who need larger text will encounter accessibility barriers.',
    shortExplanation: 'Visitors are prevented from pinching to zoom in on mobile phones.',
    shortImpact: 'Blocks people with lower vision from enlarging text on phone screens.',
    priorityReason: 'Visitors must always have the freedom to zoom in on mobile screens.',
    ownerTakeaway: 'Enabling pinch-to-zoom ensures visitors with lower vision can read your details.',
    recommendedNextStep: 'Remove `user-scalable=no` from your viewport meta tag.',
  },

  // =========================================================================
  // 5. Mobile Usability
  // =========================================================================
  'mobile.missing-viewport': {
    whatIsWrong: 'The webpage lacks a responsive viewport configuration for mobile screens.',
    whyItMatters: 'Without it, smartphones render the full desktop site shrunk down to microscopic size, forcing visitors to zoom and pan.',
    businessImpact: 'Mobile visitors face an unreadable, awkward experience, dramatically lowering conversion rates and mobile search visibility.',
    whatToDo: 'Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to your website header and verify responsive design on phones.',
    whatIfIgnored: 'The majority of modern visitors browsing on smartphones will see a shrunk, hard-to-use site.',
    shortExplanation: 'The site is not configured to adapt properly to smartphone screen sizes.',
    shortImpact: 'Mobile visitors see an awkward, shrunk-down page that is difficult to read.',
    priorityReason: 'Over 60% of modern web traffic is on mobile; failing to format for phone screens damages user experience for most visitors.',
    ownerTakeaway: 'Adding a mobile viewport tag ensures your site formats properly on smartphones.',
    recommendedNextStep: 'Add the standard responsive viewport meta tag to your website header.',
  },
  'lh.viewport': {
    whatIsWrong: 'Google\'s audit detected that the page does not have a valid mobile viewport tag.',
    whyItMatters: 'Mobile browsers will render the page at desktop width, requiring pinching and panning.',
    businessImpact: 'Google actively penalizes mobile search rankings for pages lacking mobile-friendly viewport configurations.',
    whatToDo: 'Add the standard responsive viewport meta tag to your header.',
    whatIfIgnored: 'Mobile search visibility and mobile user experience will remain severely degraded.',
    shortExplanation: 'The page lacks a mobile viewport tag for smartphone displays.',
    shortImpact: 'Causes phones to render desktop view, harming mobile search rankings.',
    priorityReason: 'A mobile viewport tag is mandatory for mobile-friendly Google ranking.',
    ownerTakeaway: 'The viewport tag tells mobile phones how to scale your site; adding it is essential.',
    recommendedNextStep: 'Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to the head.',
  },
  'mobile.viewport-not-device-width': {
    whatIsWrong: 'The page viewport uses a fixed pixel width instead of adapting dynamically to the visitor\'s device width.',
    whyItMatters: 'Different phones have different screen dimensions; fixed widths cause horizontal scrolling or awkward margins.',
    businessImpact: 'Visitors on smaller or larger phones experience horizontal scrollbars and cut-off text.',
    whatToDo: 'Change the viewport tag to `width=device-width, initial-scale=1`.',
    whatIfIgnored: 'The layout will not adapt smoothly across varying phone and tablet screen sizes.',
    shortExplanation: 'The page uses a fixed width instead of adapting to device screen sizes.',
    shortImpact: 'Causes horizontal scrolling or awkward margins on certain phones.',
    priorityReason: 'Responsive width ensures seamless presentation on all phone models.',
    ownerTakeaway: 'Setting width to device-width ensures your layout fits any phone screen perfectly.',
    recommendedNextStep: 'Update the viewport meta tag to use `width=device-width`.',
  },
  'lh.target-size': {
    whatIsWrong: 'Buttons or links are very small or clustered too closely together on touchscreens.',
    whyItMatters: 'Tapping with a finger is much less precise than clicking with a mouse cursor.',
    businessImpact: 'Visitors accidentally tap the wrong link or button, causing irritation and abandoned navigation.',
    whatToDo: 'Enlarge tap targets to at least 44 by 44 pixels and add comfortable spacing between adjacent buttons.',
    whatIfIgnored: 'Mobile users will continue experiencing accidental mis-taps and clumsy navigation.',
    shortExplanation: 'Buttons or links are too small or crowded for easy finger tapping.',
    shortImpact: 'Leads to frustrating accidental clicks on mobile touchscreens.',
    priorityReason: 'Touch targets must be thumb-friendly for visitors browsing on mobile phones.',
    ownerTakeaway: 'Spacing out buttons and making them larger makes tapping effortless on phones.',
    recommendedNextStep: 'Enlarge small buttons and add padding between adjacent links.',
  },
  'lh.font-size': {
    whatIsWrong: 'Font sizes on mobile screens are smaller than 16 pixels for body text.',
    whyItMatters: 'Small text strains readers\' eyes and often triggers automatic unwanted zoom jumps when tapping inputs.',
    businessImpact: 'Prospective clients may skim past important details or give up reading your service descriptions.',
    whatToDo: 'Increase base body font size to at least 16px on mobile views for effortless readability.',
    whatIfIgnored: 'Content remains hard to read on phone screens without manual zooming.',
    shortExplanation: 'Text is too small to read comfortably on smartphone screens.',
    shortImpact: 'Strains eyes and causes visitors to abandon reading lengthy service details.',
    priorityReason: 'Readable body text is necessary for visitors to comfortably review your offerings.',
    ownerTakeaway: 'Bumping font size up to 16px makes your website easy and comfortable to read.',
    recommendedNextStep: 'Set base mobile font size to at least 16 pixels.',
  },

  // =========================================================================
  // 6. Broken Links and Website Navigation
  // =========================================================================
  'seo.broken-internal-links': {
    whatIsWrong: 'Hyperlinks within your website lead to missing pages that show 404 error screens.',
    whyItMatters: 'Clicking a link and finding a broken page makes a business look neglected and unprofessional.',
    businessImpact: 'Potential customers give up when a link they clicked doesn\'t work, terminating what could have been an enquiry or purchase.',
    whatToDo: 'Check the list of affected links and update them to working page URLs, or set up 301 redirects to active pages.',
    whatIfIgnored: 'Visitors encounter frustrating dead ends, hurting professional credibility.',
    shortExplanation: 'Links on your website lead to missing or dead pages.',
    shortImpact: 'Directs visitors into dead ends, frustrating prospective customers.',
    priorityReason: 'Broken links directly halt visitor exploration, creating immediate friction and doubt.',
    ownerTakeaway: 'Internal links are broken; updating them restores a smooth, uninterrupted browsing journey.',
    recommendedNextStep: 'Review the list of broken links and update them to working page addresses.',
  },
  'seo.broken-external-links': {
    whatIsWrong: 'Links pointing to outside websites or partner pages are broken.',
    whyItMatters: 'Directing visitors to defunct external sites reflects poorly on the currency of your content.',
    businessImpact: 'Erodes credibility when recommended partner or resource links fail to open.',
    whatToDo: 'Update external links to current live addresses or remove obsolete references.',
    whatIfIgnored: 'Visitors will continue clicking through to external dead ends.',
    shortExplanation: 'Links to external websites are broken or defunct.',
    shortImpact: 'Sends visitors to external dead ends, reflecting poorly on currency.',
    priorityReason: 'Live reference links ensure your recommendations remain useful and professional.',
    ownerTakeaway: 'Updating outdated outside links keeps your resources fresh and reliable.',
    recommendedNextStep: 'Check external partner links and update any that no longer work.',
  },
  'seo.unverified-links': {
    whatIsWrong: 'Some external links could not be automatically confirmed due to remote server restrictions.',
    whyItMatters: 'Certain external servers block automated verification bots even when links work for human visitors.',
    businessImpact: 'Manual check is recommended to ensure your external references are functioning properly.',
    whatToDo: 'Click through the listed external links manually in a regular browser to confirm they work.',
    whatIfIgnored: 'Unverified links may harbor undetected broken destinations.',
    shortExplanation: 'Some external links could not be verified automatically.',
    shortImpact: 'A quick manual check is recommended to confirm these links open properly.',
    priorityReason: 'Human verification confirms whether external partners are still reachable.',
    ownerTakeaway: 'Click these external links manually to make sure they open the right websites.',
    recommendedNextStep: 'Test the listed links in your browser to confirm they are active.',
  },
  'lh.link-text': {
    whatIsWrong: 'Some links use generic, vague phrases like "click here" or "learn more" without describing where they lead.',
    whyItMatters: 'Vague link text gives search engines and screen readers no context about the destination page.',
    businessImpact: 'Misses valuable internal SEO anchor text signals that help target pages rank for specific keywords.',
    whatToDo: 'Rewrite link text to describe the destination specifically (e.g. "View our corporate pricing" or "Explore dental services").',
    whatIfIgnored: 'You miss out on descriptive keyword signals that help linked pages rank.',
    shortExplanation: 'Links use vague text like "click here" instead of describing destinations.',
    shortImpact: 'Misses valuable SEO keyword signals and confuses screen readers.',
    priorityReason: 'Descriptive link text clarifies navigation and boosts target page search authority.',
    ownerTakeaway: 'Replacing "click here" with descriptive text tells visitors and Google where the link leads.',
    recommendedNextStep: 'Rewrite vague button and link labels to name the destination service.',
  },
  'journey.no-navigation': {
    whatIsWrong: 'No recognizable main navigation menu was detected in standard website code.',
    whyItMatters: 'The menu is how visitors explore your services, about page, pricing, and contact options.',
    businessImpact: 'Without clear navigation, visitors who arrive on a subpage or blog post cannot discover what else your company offers.',
    whatToDo: 'Ensure a standard header navigation menu is present and accessible across desktop and mobile devices.',
    whatIfIgnored: 'Visitors have no easy way to browse beyond the page they landed on.',
    shortExplanation: 'The website lacks a standard navigation menu for exploring pages.',
    shortImpact: 'Visitors cannot easily find your other services or company information.',
    priorityReason: 'Clear navigation is the backbone that enables visitors to explore and convert.',
    ownerTakeaway: 'A clear main menu is essential for visitors to discover your full range of services.',
    recommendedNextStep: 'Add a standard accessible navigation menu to your header.',
  },
  'journey.contact-not-linked': {
    whatIsWrong: 'A contact page exists on the site, but the homepage does not link directly to it.',
    whyItMatters: 'Visitors looking for an enquiry route should not have to guess or type the URL manually.',
    businessImpact: 'Makes it harder for ready-to-buy prospects to reach your contact details.',
    whatToDo: 'Add a direct link to your contact page in the header navigation and footer.',
    whatIfIgnored: 'Some visitors will miss the contact page entirely.',
    shortExplanation: 'The contact page exists but is not linked from the homepage.',
    shortImpact: 'Visitors must hunt for contact details rather than finding a direct link.',
    priorityReason: 'Your contact page should be one click away from every single page.',
    ownerTakeaway: 'Linking your contact page from the homepage makes getting in touch effortless.',
    recommendedNextStep: 'Add a direct "Contact Us" link to the homepage header and footer.',
  },
  'journey.sitemap-unlinked': {
    whatIsWrong: 'Some pages listed in the sitemap have no internal links pointing to them from the rest of the site.',
    whyItMatters: 'These "orphan pages" are hard for visitors to find because no navigation link leads to them.',
    businessImpact: 'Valuable service pages remain hidden from visitors who browse through your menus.',
    whatToDo: 'Add navigation or contextual links pointing to these orphan pages from relevant sections of your site.',
    whatIfIgnored: 'Orphan pages will receive minimal traffic and struggle to rank.',
    shortExplanation: 'Some sitemap pages are not linked from any website menus.',
    shortImpact: 'Visitors have no way to find these pages through normal browsing.',
    priorityReason: 'Internal links distribute traffic and ranking power to all your pages.',
    ownerTakeaway: 'Link orphan pages into your main menus so visitors can easily discover them.',
    recommendedNextStep: 'Add links to these orphan pages in your navigation or service menus.',
  },

  // =========================================================================
  // 7. Contact Information and Enquiry Routes
  // =========================================================================
  'journey.no-contact-route': {
    whatIsWrong: 'No visible way to contact the business (phone, email, WhatsApp, contact form) was detected on the inspected pages.',
    whyItMatters: 'The entire purpose of most commercial websites is to generate enquiries, bookings, or sales.',
    businessImpact: 'Prospective customers who want your service cannot find how to reach you, directly resulting in lost business enquiries.',
    whatToDo: 'Add prominent contact options (phone number, WhatsApp chat button, and a simple contact form) across all key pages.',
    whatIfIgnored: 'Interested prospects cannot contact your business and will look for a competitor instead.',
    shortExplanation: 'No clear way to contact your business was found on the inspected pages.',
    shortImpact: 'Visitors ready to enquire cannot find how to get in touch, costing potential leads.',
    priorityReason: 'A website that cannot be contacted cannot generate leads or revenue; fixing this is the single fastest way to turn traffic into enquiries.',
    ownerTakeaway: 'Visitors cannot easily find how to reach you; adding prominent contact buttons will immediately unlock enquiries.',
    recommendedNextStep: 'Add your phone number, WhatsApp link, and a contact form button to the header and footer.',
  },
  'journey.contact-not-on-start': {
    whatIsWrong: 'The homepage does not show any immediate contact option or enquiry link.',
    whyItMatters: 'Many visitors land on the homepage knowing they want to get in touch; forcing them to hunt for contact details adds friction.',
    businessImpact: 'Visitors who don\'t see quick contact options may leave rather than searching through subpages.',
    whatToDo: 'Place your phone number, a WhatsApp button, and a "Contact Us" link in the homepage header and footer.',
    whatIfIgnored: 'You risk losing inbound leads from busy visitors who expect instant contact options.',
    shortExplanation: 'The homepage does not feature an immediate contact option.',
    shortImpact: 'Busy visitors may leave before finding how to get in touch.',
    priorityReason: 'Your homepage is your digital storefront; contact routes must be visible immediately upon arrival.',
    ownerTakeaway: 'Adding clear contact options right on the homepage makes it effortless for visitors to reach out.',
    recommendedNextStep: 'Add a prominent contact button and phone number to the homepage header.',
  },
  'journey.contact-not-in-header': {
    whatIsWrong: 'Contact details and enquiry links are missing from the top header navigation where visitors naturally look first.',
    whyItMatters: 'On both desktop and mobile, visitors look at the top right of the screen for phone numbers or "Contact" buttons.',
    businessImpact: 'Buried contact routes reduce conversion rates because visitors have to scroll through pages to find how to communicate.',
    whatToDo: 'Add a prominent "Contact" button or clickable phone/WhatsApp icon directly in the top header menu.',
    whatIfIgnored: 'Prospective clients spend extra effort looking for contact routes, lowering overall enquiry volume.',
    shortExplanation: 'The website header does not include a direct contact button or phone link.',
    shortImpact: 'Visitors must search down the page to find how to reach your team.',
    priorityReason: 'Header contact buttons capture high-intent visitors immediately without requiring page scrolling.',
    ownerTakeaway: 'Putting a contact button in the header puts enquiry routes front and center.',
    recommendedNextStep: 'Add a "Contact Us" button or phone number directly in the top website header.',
  },
  'journey.phone-not-clickable': {
    whatIsWrong: 'Your business phone number is displayed as plain unlinked text rather than a tap-to-call link.',
    whyItMatters: 'On smartphones, a tap-to-call link dials instantly; plain text forces the user to memorize or copy-paste the digits.',
    businessImpact: 'Mobile visitors on the go may decide not to bother copying the number, resulting in lost immediate calls.',
    whatToDo: 'Wrap your phone number in a `tel:` link (e.g. `<a href="tel:+919876543210">Call Us</a>`) so a single tap dials.',
    whatIfIgnored: 'Mobile visitors encounter friction when trying to call your business.',
    shortExplanation: 'Your phone number cannot be tapped to dial directly on mobile phones.',
    shortImpact: 'Mobile visitors must awkwardly copy-paste the number rather than tapping to call.',
    priorityReason: 'Over half your visitors are on phones; tap-to-call makes phoning your business instantaneous.',
    ownerTakeaway: 'Making phone numbers clickable lets mobile visitors call you with a single tap.',
    recommendedNextStep: 'Convert plain text phone numbers into clickable `tel:` links.',
  },

  // =========================================================================
  // 8. Conversion and Customer Journey
  // =========================================================================
  'journey.no-primary-cta': {
    whatIsWrong: 'The homepage lacks a clear, prominent primary call-to-action button (like "Request a Quote", "Book Consultation", or "Get Started").',
    whyItMatters: 'Visitors need guidance on what action to take next; without a clear prompt, they often read briefly and leave.',
    businessImpact: 'Lack of direction reduces the percentage of visitors who take the step from passive reader to active enquiry.',
    whatToDo: 'Place one prominent action button in the top banner of the homepage leading directly to your enquiry form or booking flow.',
    whatIfIgnored: 'Visitors will browse without a clear nudge toward becoming a paying customer.',
    shortExplanation: 'The homepage has no clear main call-to-action button guiding visitors to the next step.',
    shortImpact: 'Visitors are not guided toward making an enquiry or booking.',
    priorityReason: 'Clear calls to action guide interested visitors into becoming paying clients, directly driving conversions.',
    ownerTakeaway: 'A clear primary action button near the top gives visitors an immediate next step to take.',
    recommendedNextStep: 'Add a prominent primary action button (e.g., "Request a Quote") in the top banner.',
  },
  'journey.service-pages-no-next-step': {
    whatIsWrong: 'Service pages describe offerings but end abruptly without guiding the visitor to take action.',
    whyItMatters: 'When someone finishes reading about your service, that is the exact moment they are most interested in contacting you.',
    businessImpact: 'Without a concluding prompt, interested readers reach the bottom of the page and navigate away rather than enquiring.',
    whatToDo: 'Add an enquiry form, consultation button, or contact prompt at the bottom of every service description.',
    whatIfIgnored: 'You miss the peak moment of customer interest after they finish reading about your capabilities.',
    shortExplanation: 'Service pages end without prompting the reader to take the next step.',
    shortImpact: 'Interested prospects finish reading but leave without reaching out.',
    priorityReason: 'Service pages are your sales pitches; closing each page with an invitation to act maximizes leads.',
    ownerTakeaway: 'Ending every service page with a quote or booking button converts readers into inquiries.',
    recommendedNextStep: 'Add a "Request a Quote for this Service" button at the bottom of each service page.',
  },
  'journey.long-enquiry-form': {
    whatIsWrong: 'The enquiry form asks for too many details or too many optional fields upfront.',
    whyItMatters: 'Every additional form field noticeably reduces the percentage of people who finish and submit the form.',
    businessImpact: 'High friction forms suppress conversion rates, particularly on mobile devices where typing is slower.',
    whatToDo: 'Trim the initial form to only essential questions (e.g., Name, Phone/Email, Message) and collect further details during follow-up.',
    whatIfIgnored: 'Prospective clients may abandon the form halfway through, reducing total leads received.',
    shortExplanation: 'The enquiry form requests too much information upfront.',
    shortImpact: 'Form length discourages visitors, leading to incomplete submissions.',
    priorityReason: 'Short forms generate dramatically higher submission rates than lengthy questionnaires.',
    ownerTakeaway: 'Trimming form fields down to just the essentials will increase the number of enquiries you receive.',
    recommendedNextStep: 'Remove non-essential fields from your enquiry form so visitors can submit in 30 seconds.',
  },

  // =========================================================================
  // 9. Business Readiness and Trust Signals
  // =========================================================================
  'journey.no-trust-signals': {
    whatIsWrong: 'No visible customer reviews, testimonials, ratings, or trust badges were detected on key pages.',
    whyItMatters: 'First-time visitors need social proof before trusting an unfamiliar business with their money or project.',
    businessImpact: 'Hesitant prospective clients may delay reaching out or choose a competitor who displays visible client feedback.',
    whatToDo: 'Add authentic client testimonials, Google review star badges, or partner logos near your calls to action.',
    whatIfIgnored: 'Visitors may hesitate to reach out due to lack of visible credibility.',
    shortExplanation: 'The website does not display visible customer testimonials or reviews.',
    shortImpact: 'Hesitant first-time visitors lack social proof that your business is trustworthy.',
    priorityReason: 'Trust signals overcome visitor hesitation and give prospects the confidence to enquire.',
    ownerTakeaway: 'Adding customer testimonials and review ratings reassures new visitors that you are reputable.',
    recommendedNextStep: 'Showcase 2-3 genuine customer reviews or a Google rating badge on your homepage.',
  },
  'journey.form-no-privacy-link': {
    whatIsWrong: 'Forms collect visitor personal details (like phone or email) without linking to a privacy policy.',
    whyItMatters: 'Clear privacy assurance reassures visitors that their phone number and email will not be spammed or shared.',
    businessImpact: 'Privacy-conscious customers may hesitate to submit personal data, and modern privacy regulations expect disclosure.',
    whatToDo: 'Add a brief note beneath the submit button (e.g., "We respect your privacy. See our privacy policy.") linking to your policy.',
    whatIfIgnored: 'Privacy-conscious visitors may abandon form submissions out of caution.',
    shortExplanation: 'Forms collect contact details without linking to a privacy policy.',
    shortImpact: 'Privacy-conscious visitors may hesitate to share their email or phone number.',
    priorityReason: 'A privacy link reassures visitors that their personal contact details are handled responsibly.',
    ownerTakeaway: 'Adding a quick privacy assurance note under forms helps hesitant visitors submit their details.',
    recommendedNextStep: 'Add a privacy notice and policy link directly underneath your enquiry form.',
  },
  'security.no-https': {
    whatIsWrong: 'The website does not use secure HTTPS encryption, or the SSL certificate is invalid.',
    whyItMatters: 'Modern web browsers display an alarming "Not Secure" warning in the address bar when HTTPS is missing.',
    businessImpact: 'A "Not Secure" warning damages credibility immediately and alarms prospective clients, driving many away.',
    whatToDo: 'Enable a free SSL/TLS certificate (such as Let\'s Encrypt) through your hosting control panel and redirect all traffic to HTTPS.',
    whatIfIgnored: 'Browsers will continue warning visitors that your website is insecure, severely hurting trust and rankings.',
    shortExplanation: 'The website is not protected by secure HTTPS encryption.',
    shortImpact: 'Browsers show a "Not Secure" warning, alarming visitors and destroying trust.',
    priorityReason: 'Browsers actively warn visitors away from unencrypted sites; resolving this is essential for trust and security.',
    ownerTakeaway: 'Enabling SSL/HTTPS removes the alarming "Not Secure" warning and protects visitor data.',
    recommendedNextStep: 'Ask your web host to activate an SSL certificate and redirect all traffic to HTTPS.',
  },
  'lh.is-on-https': {
    whatIsWrong: 'Google\'s audit detected that some page requests are not served over secure HTTPS.',
    whyItMatters: 'Non-secure requests trigger security warnings in modern browsers.',
    businessImpact: 'Visitors may see security alerts, and Google favors fully HTTPS-secured websites in search rankings.',
    whatToDo: 'Ensure all pages and resources are served strictly over HTTPS.',
    whatIfIgnored: 'Security warnings may continue appearing in visitor address bars.',
    shortExplanation: 'Some requests are made over insecure connections.',
    shortImpact: 'Can trigger browser security warnings and dampen search rankings.',
    priorityReason: 'Full HTTPS encryption is a mandatory baseline for modern websites.',
    ownerTakeaway: 'Ensuring every resource loads over HTTPS keeps the browser padlock green and secure.',
    recommendedNextStep: 'Update all resource links to use secure HTTPS URLs.',
  },
  'security.http-not-redirected': {
    whatIsWrong: 'Typing `http://` does not automatically forward visitors to the secure `https://` version of the website.',
    whyItMatters: 'Visitors who type your domain without "https" may land on the unencrypted version.',
    businessImpact: 'Some visitors may see security warnings or submit contact forms over an insecure connection.',
    whatToDo: 'Configure a permanent 301 redirect on your server or CDN so all HTTP requests automatically route to HTTPS.',
    whatIfIgnored: 'Visitors accessing the unencrypted URL won\'t benefit from secure browsing.',
    shortExplanation: 'Unsecured web addresses do not automatically forward to the secure version.',
    shortImpact: 'Visitors who type your web address might land on an unencrypted page.',
    priorityReason: 'Automatic HTTPS redirection ensures all visitors benefit from encrypted browsing.',
    ownerTakeaway: 'Setting up an automatic redirect ensures anyone typing your web address ends up on the secure version.',
    recommendedNextStep: 'Add an automatic HTTP to HTTPS redirect rule in your hosting control panel.',
  },
  'lh.redirects-http': {
    whatIsWrong: 'The regular HTTP address does not redirect visitors to HTTPS.',
    whyItMatters: 'Visitors typing your domain directly without "https://" remain on an insecure connection.',
    businessImpact: 'Can result in split traffic and security warnings for visitors who type your address directly.',
    whatToDo: 'Implement a permanent 301 redirect from HTTP to HTTPS in server or CDN settings.',
    whatIfIgnored: 'Some visitors will continue landing on the non-secure version of your site.',
    shortExplanation: 'HTTP addresses do not redirect to secure HTTPS.',
    shortImpact: 'Visitors may browse over an unencrypted connection.',
    priorityReason: 'A permanent redirect guarantees every visitor is protected by encryption.',
    ownerTakeaway: 'Forwarding all HTTP traffic to HTTPS ensures consistent security across the board.',
    recommendedNextStep: 'Enable automatic HTTPS redirection at your web host or Cloudflare.',
  },
  'security.mixed-content': {
    whatIsWrong: 'Secure HTTPS pages load certain images, scripts, or fonts over an insecure HTTP connection.',
    whyItMatters: 'Browsers block insecure scripts or show broken padlock warnings on otherwise secure pages.',
    businessImpact: 'Broken images or security warnings degrade trust and can break interactive features like forms or sliders.',
    whatToDo: 'Update the URLs of all embedded images, scripts, and stylesheets to use `https://`.',
    whatIfIgnored: 'Browsers may block mixed content files, causing broken elements or security warnings.',
    shortExplanation: 'Secure pages load some images or scripts over an insecure connection.',
    shortImpact: 'Can cause broken page elements and browser security warnings.',
    priorityReason: 'Mixed content breaks browser security and can cause images or scripts to fail to load.',
    ownerTakeaway: 'Updating internal links to HTTPS ensures the padlock remains intact and scripts don\'t get blocked.',
    recommendedNextStep: 'Replace any remaining `http://` image or script links with `https://`.',
  },
  'security.no-hsts': {
    whatIsWrong: 'The website does not declare an HSTS (Strict-Transport-Security) security header.',
    whyItMatters: 'HSTS instructs browsers to always communicate with your website via HTTPS, even before the first redirect.',
    businessImpact: 'This is a security hardening enhancement that protects against downgrade interception attacks.',
    whatToDo: 'Once HTTPS is working cleanly everywhere, enable the Strict-Transport-Security header on your web server.',
    whatIfIgnored: 'The site misses out on an advanced security hardening standard.',
    shortExplanation: 'The server does not tell browsers to enforce HTTPS connections strictly.',
    shortImpact: 'A security hardening step that prevents downgrade attacks once HTTPS is fully tested.',
    priorityReason: 'HSTS provides top-tier security hardening for sensitive transactions and data.',
    ownerTakeaway: 'HSTS is a recommended security hardening step to add once your SSL certificate is stable.',
    recommendedNextStep: 'Ask your developer to add the HSTS header after confirming HTTPS works everywhere.',
  },

  // =========================================================================
  // 10. E-commerce Readiness
  // =========================================================================
  'journey.shop-no-cart': {
    whatIsWrong: 'Products are featured on the website, but no digital shopping cart, checkout, or online purchase pathway was detected.',
    whyItMatters: 'If you intend to sell products directly online, visitors need a seamless way to add items to a cart and pay.',
    businessImpact: 'Visitors expecting an e-commerce shopping experience cannot complete transactions online.',
    whatToDo: 'If you sell online, configure a cart and checkout flow; if you sell via custom quotes or WhatsApp, clearly state that on product pages.',
    whatIfIgnored: 'Visitors seeking online ordering will be unable to purchase directly from the site.',
    shortExplanation: 'Products are displayed, but no online cart or checkout option was found.',
    shortImpact: 'Visitors expecting to purchase online cannot complete orders directly.',
    priorityReason: 'Clear purchase pathways ensure visitors understand how to buy your products.',
    ownerTakeaway: 'Clarify whether customers can buy online or should enquire via WhatsApp for product orders.',
    recommendedNextStep: 'Add either an online checkout or clear "Order via WhatsApp" buttons on product pages.',
  },
};

/**
 * Fallback generator for findings that do not match an exact rule ID.
 * Generates accurate, non-generic explanations based on category and finding properties.
 */
function getCategoryFallback(finding: Finding): RuleExplanationTemplate {
  const title = finding.title;
  const summary = finding.plainSummary || finding.title;
  const rec = finding.recommendation || 'Review this item with your web developer to implement the recommended fix.';

  switch (finding.category) {
    case 'performance':
      return {
        whatIsWrong: summary,
        whyItMatters: 'Fast loading speeds keep visitors on your website. When pages delay, prospective clients quickly become frustrated and may leave.',
        businessImpact: 'Sluggish performance may increase bounce rates and reduce enquiries, especially from visitors browsing on mobile networks.',
        whatToDo: rec,
        whatIfIgnored: 'Your website may continue to feel slower than competitors, potentially capping conversion rates.',
        shortExplanation: summary,
        shortImpact: 'May slow down browsing and increase visitor bounce rates on mobile.',
        priorityReason: 'Speed and responsiveness directly influence whether visitors stay to read your offerings.',
        ownerTakeaway: `${title}: improving loading speed helps keep visitors on your site.`,
        recommendedNextStep: rec,
      };

    case 'seo':
      return {
        whatIsWrong: summary,
        whyItMatters: 'Search engines rely on clean structure, tags, and indexing signals to accurately rank your pages in search results.',
        businessImpact: 'Issues in search configuration may lower organic search rankings and reduce how many potential clients discover your business online.',
        whatToDo: rec,
        whatIfIgnored: 'Search engines may struggle to understand or prominently display your pages in search results.',
        shortExplanation: summary,
        shortImpact: 'May reduce your visibility and click appeal in search engine results.',
        priorityReason: 'Search engine visibility brings consistent prospective clients directly to your business.',
        ownerTakeaway: `${title}: resolving this search signal helps Google index your pages accurately.`,
        recommendedNextStep: rec,
      };

    case 'accessibility':
      return {
        whatIsWrong: summary,
        whyItMatters: 'Accessible websites ensure that all visitors, including those using screen readers or assistive tools, can navigate and interact smoothly.',
        businessImpact: 'Accessibility barriers may prevent prospective customers with disabilities from understanding your services or completing forms.',
        whatToDo: rec,
        whatIfIgnored: 'Visitors who rely on assistive tools or specific display settings may encounter roadblocks.',
        shortExplanation: summary,
        shortImpact: 'May make it harder for visitors using assistive tools to interact with your site.',
        priorityReason: 'An accessible website ensures every prospective client can navigate and reach your team.',
        ownerTakeaway: `${title}: fixing this accessibility item ensures your site welcomes all visitors.`,
        recommendedNextStep: rec,
      };

    case 'mobile':
      return {
        whatIsWrong: summary,
        whyItMatters: 'Most visitors browse commercial websites on smartphones; layouts and tap targets must adapt comfortably to mobile screens.',
        businessImpact: 'Awkward mobile layouts or tiny buttons can frustrate smartphone visitors, leading them to leave without contacting you.',
        whatToDo: rec,
        whatIfIgnored: 'Mobile visitors will continue experiencing clunky browsing or accidental taps.',
        shortExplanation: summary,
        shortImpact: 'May frustrate smartphone visitors and reduce mobile enquiry rates.',
        priorityReason: 'Mobile usability is critical because the majority of web traffic comes from phones.',
        ownerTakeaway: `${title}: mobile optimization ensures smooth browsing on phone screens.`,
        recommendedNextStep: rec,
      };

    case 'journey':
      return {
        whatIsWrong: summary,
        whyItMatters: 'A smooth customer journey guides visitors from reading about your capabilities to easily contacting or booking your service.',
        businessImpact: 'Unclear next steps, buried contact details, or long forms can cause prospective clients to drop off before reaching you.',
        whatToDo: rec,
        whatIfIgnored: 'Interested visitors may navigate away without completing an enquiry or purchase.',
        shortExplanation: summary,
        shortImpact: 'May create friction for prospective clients trying to get in touch.',
        priorityReason: 'Streamlining customer pathways directly improves the rate at which visitors become leads.',
        ownerTakeaway: `${title}: clarifying customer pathways makes it easier for prospects to enquire.`,
        recommendedNextStep: rec,
      };

    case 'security':
      return {
        whatIsWrong: summary,
        whyItMatters: 'Website security safeguards visitor data and prevents browsers from displaying alarming warning messages.',
        businessImpact: 'Security warnings or unencrypted connections can immediately undermine customer trust and damage credibility.',
        whatToDo: rec,
        whatIfIgnored: 'Browsers may flag the site as untrusted, turning away prospective clients.',
        shortExplanation: summary,
        shortImpact: 'May undermine visitor trust or trigger browser security alerts.',
        priorityReason: 'Security is a vital foundation for customer trust and search engine acceptance.',
        ownerTakeaway: `${title}: resolving security items protects visitor confidence and data.`,
        recommendedNextStep: rec,
      };

    case 'crawl':
      return {
        whatIsWrong: summary,
        whyItMatters: 'Search engines and visitors must be able to reach your pages reliably without encountering timeouts or errors.',
        businessImpact: 'Server connection issues or dead links can prevent search bots and clients from viewing your content.',
        whatToDo: rec,
        whatIfIgnored: 'Certain pages may remain inaccessible to search engines or visitors.',
        shortExplanation: summary,
        shortImpact: 'May prevent search crawlers or visitors from reaching parts of your site.',
        priorityReason: 'Reliable crawler access is prerequisite for search indexing and visitor traffic.',
        ownerTakeaway: `${title}: fixing crawl and connection issues ensures reliable access to your pages.`,
        recommendedNextStep: rec,
      };

    case 'technology':
    case 'best-practices':
    default:
      return {
        whatIsWrong: summary,
        whyItMatters: 'Following modern web standards ensures your website remains stable, fast, and compatible with current browsers.',
        businessImpact: 'Outdated configurations can lead to unexpected glitches, slower performance, or compatibility issues across devices.',
        whatToDo: rec,
        whatIfIgnored: 'Underlying technical debt can accumulate and cause future reliability issues.',
        shortExplanation: summary,
        shortImpact: 'May lead to technical glitches or slower performance over time.',
        priorityReason: 'Modern web best practices ensure stability and future-proof performance.',
        ownerTakeaway: `${title}: addressing this technical standard keeps your website healthy and stable.`,
        recommendedNextStep: rec,
      };
  }
}

/**
 * Returns a complete 5-part business explanation for any finding,
 * completely deterministic and grounded in the finding data.
 */
export function getBusinessExplanation(finding: Finding): BusinessExplanation {
  const template = RULE_EXPLANATIONS[finding.id] ?? getCategoryFallback(finding);

  // Status notes to distinguish confirmed, likely, hypothesis, and manual review
  let statusNote: string | undefined;
  if (finding.status === 'manual-review') {
    statusNote = 'Manual Check Recommended: This item could not be verified automatically. Check this directly on your website or confirm with your team.';
  } else if (finding.status === 'hypothesis') {
    statusNote = 'Preliminary Observation: This is an indirect signal detected during automated inspection. Review your live pages to confirm whether this applies.';
  } else if (finding.status === 'likely') {
    statusNote = 'Likely Finding: Detected based on standard pattern analysis; a quick check on your website is recommended before changing settings.';
  }

  // Priority reasoning tuned with severity
  const severityPrefix =
    finding.severity === 'critical'
      ? 'Critical urgency: '
      : finding.severity === 'high'
        ? 'High priority: '
        : finding.severity === 'medium'
          ? 'Medium priority: '
          : 'Low priority: ';

  const priorityReason = `${severityPrefix}${template.priorityReason}`;

  return {
    whatIsWrong: template.whatIsWrong,
    whyItMatters: template.whyItMatters,
    businessImpact: template.businessImpact,
    whatToDo: template.whatToDo,
    whatIfIgnored: template.whatIfIgnored,
    shortExplanation: template.shortExplanation,
    shortImpact: template.shortImpact,
    priorityReason,
    ownerTakeaway: template.ownerTakeaway,
    recommendedNextStep: template.recommendedNextStep,
    statusNote,
  };
}

/**
 * Returns top-issue specific explanations for the Top 3 cards in Normal Mode.
 */
export function getTopIssueExplanation(finding: Finding, rank: number) {
  const explanation = getBusinessExplanation(finding);
  const rankPrefix = rank === 1 ? 'Primary focus' : rank === 2 ? 'Second priority' : 'Third priority';

  return {
    priorityReason: `${rankPrefix}: ${explanation.priorityReason}`,
    ownerTakeaway: explanation.ownerTakeaway,
    recommendedNextStep: explanation.recommendedNextStep,
    explanation,
  };
}

/**
 * Maps technical finding IDs to simple, jargon-free titles for business owners.
 * Avoids acronyms like LCP, CLS, DOM, CSS, JS, Canonical in primary headlines.
 */
const BUSINESS_TITLES: Record<string, string> = {
  'lh.metric.largest-contentful-paint': 'Your website content loads slowly',
  'lh.largest-contentful-paint': 'Your website content loads slowly',
  'lh.metric.total-blocking-time': 'Website freezes or delays responding to clicks',
  'lh.interactive': 'Website takes too long to become interactive',
  'lh.metric.cumulative-layout-shift': 'Page elements jump around while loading',
  'lh.layout-shifts': 'Page elements jump around while loading',
  'lh.metric.first-contentful-paint': 'Initial visual content takes too long to appear',
  'lh.metric.speed-index': 'Page content fills in slowly on screen',
  'lh.render-blocking-resources': 'Background code delays initial page display',
  'lh.unused-javascript': 'Unused code files slow down mobile loading',
  'lh.unused-css-rules': 'Unused style files add page loading delay',
  'lh.modern-image-formats': 'Images use older formats that take too much data',
  'lh.uses-optimized-images': 'Image files are large and uncompressed',
  'lh.offscreen-images': 'Hidden images download immediately instead of when scrolled',
  'lh.total-byte-weight': 'Total page size is very heavy for mobile networks',
  'lh.server-response-time': 'Web hosting server takes too long to respond',
  'lh.document-latency-insight': 'Hosting server delays sending initial webpage data',
  'lh.uses-text-compression': 'Text files are sent without standard compression',
  'lh.uses-long-cache-ttl': 'Website does not save unchanging files for return visits',
  'lh.errors-in-console': 'Browser encountered background code errors',
  'seo.start-page-error': 'Homepage returns an error status instead of loading',
  'lh.http-status-code': 'Page returned a server error to search engines',
  'crawl.start-unreachable': 'Automated search crawlers could not connect to your homepage',
  'crawl.start-refused': 'Website firewall blocked automated search crawlers',
  'crawl.error-pages': 'Links on your website lead to error pages (404)',
  'crawl.client-rendered': 'Content relies on browser scripts instead of ready HTML',
  'seo.redirect-chain': 'Web address hops through multiple unnecessary redirects',
  'seo.canonical-invalid': 'Master URL tag contains an invalid address',
  'seo.canonical-multiple': 'Conflicting master URL tags confuse search engines',
  'seo.canonical-cross-domain': 'Master URL tag points to an external website domain',
  'seo.canonical-missing': 'Pages do not specify a preferred master URL for Google',
  'lh.canonical': 'Master URL tag is invalid or conflicting',
  'lh.crawlable-anchors': 'Links use script buttons instead of crawlable web links',
  'seo.noindex-start': 'Homepage is hidden from Google search results',
  'lh.is-crawlable': 'Search engines are told not to index this page',
  'seo.noindex-pages': 'Certain pages are hidden from Google search results',
  'seo.robots-blocks-all': 'Search engines are blocked from your entire website',
  'lh.robots-txt': 'Robots.txt file contains errors that confuse crawlers',
  'seo.robots-unavailable': 'Robots.txt file is intermittently unavailable',
  'seo.robots-missing': 'Website has no robots.txt file to guide search crawlers',
  'seo.sitemap-not-found': 'Search engines lack a sitemap to discover all your pages',
  'seo.sitemap-invalid': 'XML sitemap contains formatting errors or broken links',
  'seo.sitemap-not-in-robots': 'Robots.txt file does not declare your sitemap location',
  'seo.missing-title': 'Pages lack a title headline for Google search',
  'lh.document-title': 'Webpage has no document title for search engines',
  'seo.title-length': 'Page titles are cut off or too short in Google results',
  'seo.multiple-titles': 'Multiple conflicting titles exist on the page',
  'seo.duplicate-titles': 'Multiple pages share identical search titles',
  'seo.missing-description': 'Pages lack a preview description for search results',
  'lh.meta-description': 'Webpage has no meta description summary',
  'seo.description-length': 'Meta descriptions are cut off or too short in search snippets',
  'seo.duplicate-descriptions': 'Multiple pages share identical preview descriptions',
  'seo.missing-h1': 'Pages lack a main headline explaining what is offered',
  'seo.multiple-h1': 'Pages have multiple competing main headlines',
  'seo.thin-content': 'Pages contain very little descriptive text about your service',
  'seo.no-structured-data': 'Missing structured business details for Google search cards',
  'seo.invalid-jsonld': 'Structured business schema data contains code errors',
  'seo.missing-open-graph': 'Links shared on WhatsApp or social media lack rich previews',
  'a11y.images-missing-alt': 'Images lack written descriptions for screen readers',
  'lh.image-alt': 'Images lack descriptive text for assistive technology',
  'a11y.unlabeled-fields': 'Form fields lack clear labels, confusing visitors',
  'lh.label': 'Form inputs have no accessible labels for screen readers',
  'a11y.unnamed-buttons': 'Buttons do not describe what action they perform',
  'lh.button-name': 'Interactive buttons have no accessible name',
  'a11y.unnamed-links': 'Icon links lack text explaining where they lead',
  'lh.link-name': 'Links lack accessible text describing their destination',
  'a11y.missing-lang': 'Webpage does not declare its primary language in code',
  'a11y.heading-skips': 'Headings skip levels, confusing screen readers',
  'lh.heading-order': 'Headings do not follow a logical structural order',
  'a11y.positive-tabindex': 'Elements jump out of order when pressing the Tab key',
  'lh.color-contrast': 'Text color blends into the background, making it hard to read',
  'a11y.zoom-disabled': 'Visitors are blocked from pinching to zoom on mobile phones',
  'mobile.missing-viewport': 'Website does not adapt properly to smartphone screens',
  'lh.viewport': 'Page lacks a mobile viewport tag for phone displays',
  'mobile.viewport-not-device-width': 'Page uses fixed width instead of adapting to phone size',
  'lh.target-size': 'Buttons or links are too small for easy finger tapping',
  'lh.font-size': 'Text is too small to read comfortably on smartphones',
  'seo.broken-internal-links': 'Links on your website lead to missing 404 error pages',
  'seo.broken-external-links': 'Links to outside websites or partner pages are broken',
  'lh.link-text': 'Links use vague phrases like "click here" instead of naming destinations',
  'journey.no-navigation': 'Website lacks a standard main navigation menu',
  'journey.contact-not-linked': 'Contact page exists but is not linked from the homepage',
  'journey.sitemap-unlinked': 'Some sitemap pages are not linked from any menus',
  'journey.no-contact-route': 'No clear way to contact your business was found',
  'journey.contact-not-on-start': 'Homepage shows no direct way to contact your team',
  'journey.contact-not-in-header': 'Website header has no phone number or contact button',
  'journey.phone-not-clickable': 'Phone number cannot be tapped to dial on mobile phones',
  'journey.no-primary-cta': 'Homepage has no clear next-step action button',
  'journey.service-pages-no-next-step': 'Service pages end abruptly without a prompt to enquire',
  'journey.long-enquiry-form': 'Enquiry form asks for too much information upfront',
  'journey.no-trust-signals': 'Website does not display visible customer testimonials or reviews',
  'journey.form-no-privacy-link': 'Contact forms collect details without linking to a privacy policy',
  'security.no-https': 'Website connection is marked "Not Secure" by web browsers',
  'lh.is-on-https': 'Some requests are made over an insecure connection',
  'security.http-not-redirected': 'Web address does not automatically redirect to secure HTTPS',
  'lh.redirects-http': 'HTTP address does not forward visitors to secure HTTPS',
  'security.mixed-content': 'Secure pages load some images or scripts over an insecure connection',
  'security.no-hsts': 'Server does not enforce strict HTTPS security rules',
  'journey.shop-no-cart': 'Products are displayed, but no online cart or checkout was found',
};

export function getBusinessFriendlyTitle(finding: Finding): string {
  const mapped = BUSINESS_TITLES[finding.id];
  if (mapped) return mapped;

  // Clean out common technical acronyms from raw finding titles
  const cleaned = finding.title
    .replace(/\b(Lighthouse|LCP|CLS|FID|INP|FCP|DOM|HTML|JSON-LD|HSTS)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned.length > 5 ? cleaned : finding.title;
}

export interface BusinessImpactItem {
  id: string;
  categoryTitle: string;
  headline: string;
  explanation: string;
  triggerCount: number;
  tone: 'rose' | 'amber' | 'blue';
}

/**
 * Returns real, finding-grounded business impacts using measured language ("may", "could").
 */
export function getBusinessImpacts(findings: Finding[]): BusinessImpactItem[] {
  const actionable = findings.filter((f) => f.severity !== 'info');
  const impacts: BusinessImpactItem[] = [];

  // 1. Visitor retention & speed
  const speedFindings = actionable.filter((f) => f.category === 'performance');
  if (speedFindings.length > 0) {
    impacts.push({
      id: 'speed',
      categoryTitle: 'Visitor Retention & Speed',
      headline: 'Visitors may leave before seeing your services',
      explanation: 'When page content or buttons take several seconds to load, visitors on mobile connections often bounce back to search results before reviewing your offerings.',
      triggerCount: speedFindings.length,
      tone: speedFindings.some((f) => f.severity === 'critical' || f.severity === 'high') ? 'rose' : 'amber',
    });
  }

  // 2. Customer contact & enquiries
  const contactFindings = actionable.filter(
    (f) => f.category === 'journey' && (f.id.includes('contact') || f.id.includes('phone') || f.id.includes('cta') || f.id.includes('form')),
  );
  if (contactFindings.length > 0) {
    impacts.push({
      id: 'contact',
      categoryTitle: 'Customer Contact & Enquiries',
      headline: 'Customers may struggle to contact your business',
      explanation: 'Unclickable phone numbers, missing header contact buttons, or lengthy forms could make interested prospects give up and look for an alternative provider.',
      triggerCount: contactFindings.length,
      tone: contactFindings.some((f) => f.severity === 'critical' || f.severity === 'high') ? 'rose' : 'amber',
    });
  }

  // 3. Search engines & discoverability
  const seoFindings = actionable.filter((f) => f.category === 'seo' || f.category === 'crawl');
  if (seoFindings.length > 0) {
    impacts.push({
      id: 'seo',
      categoryTitle: 'Google Search Visibility',
      headline: 'Search engines may have difficulty understanding or ranking your pages',
      explanation: 'Missing page titles, broken links, or indexing tags can limit how prominently Google displays your website to prospective searchers looking for your services.',
      triggerCount: seoFindings.length,
      tone: seoFindings.some((f) => f.severity === 'critical' || f.severity === 'high') ? 'rose' : 'amber',
    });
  }

  // 4. Mobile user experience
  const mobileFindings = actionable.filter((f) => f.category === 'mobile' || f.category === 'accessibility');
  if (mobileFindings.length > 0) {
    impacts.push({
      id: 'mobile',
      categoryTitle: 'Mobile Experience',
      headline: 'Smartphone visitors may face navigation barriers',
      explanation: 'Small tap targets, unformatted mobile viewports, or low contrast text could create a frustrating experience for the majority of users browsing on phones.',
      triggerCount: mobileFindings.length,
      tone: mobileFindings.some((f) => f.severity === 'critical' || f.severity === 'high') ? 'rose' : 'amber',
    });
  }

  // 5. Trust & credibility
  const trustFindings = actionable.filter((f) => f.category === 'security' || f.id.includes('trust'));
  if (trustFindings.length > 0) {
    impacts.push({
      id: 'trust',
      categoryTitle: 'Trust & Credibility',
      headline: 'First-time visitors may hesitate to trust your website',
      explanation: 'Browser warnings about unencrypted connections or a lack of customer testimonials could cause prospective clients to hesitate before reaching out.',
      triggerCount: trustFindings.length,
      tone: trustFindings.some((f) => f.severity === 'critical' || f.severity === 'high') ? 'rose' : 'amber',
    });
  }

  return impacts;
}
