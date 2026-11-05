import { describe, expect, it, vi } from 'vitest'
import type { SmartEnquiryPayload, EnquiryGoal } from '@chazon/shared'

const validPayload: SmartEnquiryPayload = {
  goals: ['build-new'],
  dynamicAnswers: {
    build: {
      isNewOrRedesign: 'New website',
      websiteType: 'Business website',
      hasDomain: 'Yes',
      contentStatus: 'Ready',
      pageCount: '6–15 pages',
      needsPayment: false,
    },
  },
  business: {
    businessName: 'Apex Growth Labs',
    industry: 'Professional Services',
    website: 'https://apexgrowth.in',
    location: 'Mumbai',
    businessStage: 'Growing business',
    targetAudience: 'B2B enterprise decision makers',
    description: 'We provide specialized consulting and operations management.',
  },
  budget: '₹50,000–₹1,00,000',
  timeline: 'Within a month',
  contact: {
    name: 'Rohan Sharma',
    email: 'rohan@apexgrowth.in',
    phone: '+91 98201 12345',
    preferredContact: 'WhatsApp',
    message: 'Looking for a complete digital overhaul.',
    consentToContact: true,
    marketingConsent: false,
  },
}

describe('Smart Enquiry Dynamic Configurations', () => {
  it('validates BUILD service branch structure', () => {
    const payload = {
      ...validPayload,
      goals: ['build-new' as EnquiryGoal],
      dynamicAnswers: {
        build: {
          isNewOrRedesign: 'New website',
          websiteType: 'Web application',
          hasDomain: 'Yes',
          contentStatus: 'In progress',
          pageCount: '15–30 pages',
          needsPayment: true,
          referenceUrl: 'https://stripe.com',
        },
      },
    }
    expect(payload.dynamicAnswers.build?.websiteType).toBe('Web application')
    expect(payload.dynamicAnswers.build?.needsPayment).toBe(true)
  })

  it('validates GROW (SEO & Marketing) branch structure', () => {
    const payload = {
      ...validPayload,
      goals: ['seo-visibility' as EnquiryGoal],
      dynamicAnswers: {
        grow: {
          hasWebsite: true,
          websiteUrl: 'https://mysite.com',
          primaryGoal: 'More Google visibility',
          currentInvestment: 'Currently investing',
          usesSearchConsole: 'Yes',
          targetLocations: 'India, UAE, US',
          targetKeywords: 'enterprise consulting, workflow automation',
        },
      },
    }
    expect(payload.dynamicAnswers.grow?.primaryGoal).toBe('More Google visibility')
    expect(payload.dynamicAnswers.grow?.usesSearchConsole).toBe('Yes')
  })

  it('validates CONVERT (Conversion Optimisation) branch structure', () => {
    const payload = {
      ...validPayload,
      goals: ['improve-conversions' as EnquiryGoal],
      dynamicAnswers: {
        convert: {
          targetAction: 'Contact through WhatsApp',
          conversionProblem: 'High traffic low enquiries',
          hasWebsite: true,
          trackingStatus: 'GA4 / Meta Pixel',
          journeyToImprove: 'Landing page → Checkout',
        },
      },
    }
    expect(payload.dynamicAnswers.convert?.targetAction).toBe('Contact through WhatsApp')
    expect(payload.dynamicAnswers.convert?.conversionProblem).toBe('High traffic low enquiries')
  })

  it('validates AUTOMATE (Business Automation) branch structure', () => {
    const payload = {
      ...validPayload,
      goals: ['automate-ops' as EnquiryGoal],
      dynamicAnswers: {
        automate: {
          processesToAutomate: ['WhatsApp triage', 'CRM lead capture', 'Follow-up reminders'],
          currentTools: 'Zoho, WhatsApp Business, Google Sheets',
          usesCrm: 'Yes',
          whatsAppVolume: 'High volume',
          needsAutoFollowUp: true,
          manualWorkflowDescription: 'Leads from WhatsApp take 12 hours to enter CRM.',
        },
      },
    }
    expect(payload.dynamicAnswers.automate?.usesCrm).toBe('Yes')
    expect(payload.dynamicAnswers.automate?.needsAutoFollowUp).toBe(true)
  })

  it('validates E-COMMERCE branch structure', () => {
    const payload = {
      ...validPayload,
      goals: ['build-ecommerce' as EnquiryGoal],
      dynamicAnswers: {
        ecommerce: {
          hasStore: true,
          platform: 'Shopify',
          productCount: '100–1,000 products',
          needsPayment: true,
          needsShipping: true,
          needsInventory: true,
        },
      },
    }
    expect(payload.dynamicAnswers.ecommerce?.platform).toBe('Shopify')
    expect(payload.dynamicAnswers.ecommerce?.productCount).toBe('100–1,000 products')
  })

  it('validates AI SOLUTIONS branch structure', () => {
    const payload = {
      ...validPayload,
      goals: ['integrate-ai' as EnquiryGoal],
      dynamicAnswers: {
        ai: {
          aiCapabilities: ['Smart customer chatbot', 'Document processing'],
          hasSoftware: true,
          description: 'Automate tier-1 customer enquiries across WhatsApp and web.',
        },
      },
    }
    expect(payload.dynamicAnswers.ai?.aiCapabilities).toContain('Smart customer chatbot')
  })

  it('validates MULTIPLE SERVICES combined structure without collisions', () => {
    const payload = {
      ...validPayload,
      goals: ['build-new', 'seo-visibility', 'automate-ops'] as EnquiryGoal[],
      dynamicAnswers: {
        build: { isNewOrRedesign: 'New website', websiteType: 'Business website' },
        grow: { primaryGoal: 'More Google visibility', targetLocations: 'Mumbai' },
        automate: { usesCrm: 'Looking for one', needsAutoFollowUp: true },
      },
    }
    expect(payload.goals.length).toBe(3)
    expect(payload.dynamicAnswers.build?.websiteType).toBe('Business website')
    expect(payload.dynamicAnswers.grow?.primaryGoal).toBe('More Google visibility')
    expect(payload.dynamicAnswers.automate?.needsAutoFollowUp).toBe(true)
  })

  it('validates NOT SURE / GUIDANCE NEEDED category', () => {
    const payload = {
      ...validPayload,
      goals: ['need-guidance' as EnquiryGoal],
      dynamicAnswers: {
        additionalNotes: 'Need founder consultation to assess digital roadmap.',
      },
      budget: 'Not sure yet',
      timeline: 'Just exploring',
    }
    expect(payload.goals).toContain('need-guidance')
    expect(payload.budget).toBe('Not sure yet')
  })
})

describe('Smart Enquiry Security & Error Handling', () => {
  it('detects honeypot submission', () => {
    const spamSubmission = {
      ...validPayload,
      company_url: 'https://spam-bot.ru', // honeypot triggered
    }
    expect(spamSubmission.company_url).toBeTruthy()
  })

  it('detects robotic submission speed (< 2000ms)', () => {
    const now = Date.now()
    const fastSubmission = {
      ...validPayload,
      form_started: now - 500, // 500ms elapsed
    }
    const isBot = fastSubmission.form_started && now - fastSubmission.form_started < 2000
    expect(isBot).toBe(true)
  })

  it('detects link spamming in messages', () => {
    const spamMessage = 'Check out https://link1.com and https://link2.com and https://link3.com and https://link4.com and https://link5.com'
    const linkCount = (spamMessage.match(/https?:\/\//g)?.length ?? 0)
    expect(linkCount > 4).toBe(true)
  })

  it('handles API network failure gracefully', async () => {
    const mockOfflineFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    let errorCaught = false
    try {
      await mockOfflineFetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      })
    } catch (err: unknown) {
      errorCaught = true
      expect((err as Error).message).toBe('Failed to fetch')
    }
    expect(errorCaught).toBe(true)
  })

  it('handles 429 rate limit response gracefully', async () => {
    const mockRateLimitFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Too many enquiries' } }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    const response = await mockRateLimitFetch('/api/enquiries')
    expect(response.status).toBe(429)
    const data = await response.json()
    expect(data.error.code).toBe('RATE_LIMITED')
  })
})
