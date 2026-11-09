import {
  ArrowRight,
  BarChart2,
  Layers,
  RefreshCw,
  Search,
  Send,
  Target,
} from 'lucide-react'

export interface ProcessTimelineProps {
  variant?: 'horizontal' | 'detailed'
}

export function ProcessTimeline({ variant = 'horizontal' }: ProcessTimelineProps) {
  const steps = [
    {
      num: '01',
      title: 'Discover',
      text: 'Understand your business, goals and challenges.',
      icon: Search,
    },
    {
      num: '02',
      title: 'Strategise',
      text: 'Build a tailored digital growth plan.',
      icon: Target,
    },
    {
      num: '03',
      title: 'Build',
      text: 'Develop the right solutions and assets.',
      icon: Layers,
    },
    {
      num: '04',
      title: 'Execute',
      text: 'Launch and run multi-channel campaigns.',
      icon: Send,
    },
    {
      num: '05',
      title: 'Measure',
      text: 'Track performance and business impact.',
      icon: BarChart2,
    },
    {
      num: '06',
      title: 'Optimise',
      text: 'Continuously improve for better results.',
      icon: RefreshCw,
    },
  ]

  return (
    <div className={`process-timeline-wrapper variant-${variant}`}>
      <div className="process-horizontal-row" role="list" aria-label="Six Stage Process">
        {steps.map((step, idx) => {
          const Icon = step.icon
          return (
            <div key={step.num} className="process-horizontal-step-wrap">
              <div className="process-horizontal-step" role="listitem">
                <div className="phs-header-row">
                  <div className="phs-icon-wrap" aria-hidden="true">
                    <Icon size={16} strokeWidth={2.4} />
                  </div>
                  <div className="phs-num-title">
                    <span className="phs-num">{step.num}</span>
                    <h3 className="phs-title">{step.title}</h3>
                  </div>
                </div>
                <p className="phs-copy">{step.text}</p>
              </div>

              {idx < steps.length - 1 && (
                <span className="phs-arrow-connector" aria-hidden="true">
                  <ArrowRight size={14} />
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
