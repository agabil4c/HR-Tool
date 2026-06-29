import UpcomingEventsSummary from '@/components/UpcomingEventsSummary';

export const DashboardHero = ({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  highlights = [],
  summaryTitle = 'Operational calendar',
  summaryMaxItems = 4,
  accentClassName = 'bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(12,74,110,0.92)_55%,_rgba(8,47,73,0.96))]'
}) => {
  return <section className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
      <div className={`xl:col-span-8 overflow-hidden rounded-3xl border border-default-200 p-6 text-white shadow-xl shadow-sky-950/10 md:p-8 ${accentClassName}`}>
        {eyebrow && <div className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-sky-100">
              {eyebrow}
            </span>
          </div>}

        {(title || description) && <div className="max-w-3xl">
            {title && <h1 className="font-[Tourney] text-3xl uppercase tracking-[0.12em] text-white sm:text-4xl lg:text-5xl">{title}</h1>}
            {description && <p className="mt-4 max-w-2xl text-sm leading-7 text-sky-50/80 sm:text-base">{description}</p>}
          </div>}

        {(primaryAction || secondaryAction) && <div className="mt-8 flex flex-wrap gap-3">
            {primaryAction}
            {secondaryAction}
          </div>}

        {highlights.length > 0 && <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {highlights.map(item => {
            const Icon = item.icon;
            return <div key={item.label} className={`rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-sm ${item.tint}`}>
                  <div className="mb-5 flex items-center justify-between">
                    <span className="text-sm font-medium text-white/80">{item.label}</span>
                    {Icon && <span className="flex size-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                        <Icon className="size-5" />
                      </span>}
                  </div>
                  <p className="text-3xl font-semibold tracking-tight text-white">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">{item.detail}</p>
                </div>;
          })}
          </div>}
      </div>

      <div className="xl:col-span-4">
        <UpcomingEventsSummary title={summaryTitle} maxItems={summaryMaxItems} className="mb-0 h-full" contentClassName="h-full" />
      </div>
    </section>;
};

export const DashboardSectionHeading = ({ eyebrow, title, description, badge }) => {
  return <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.22em] text-default-500">{eyebrow}</p>}
        <h2 className="mt-2 text-2xl font-semibold text-default-900">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        {badge && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{badge}</span>}
        {description && <p className="max-w-2xl text-sm leading-6 text-default-500">{description}</p>}
      </div>
    </div>;
};