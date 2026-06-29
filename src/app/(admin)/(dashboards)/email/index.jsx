import PageBreadcrumb from '@/components/PageBreadcrumb';
import ComposeEmail from './components/ComposeEmail';
import EmailBarChart from './components/EmailBarChart';
import EmailData from './components/EmailData';
import EmailLineChart from './components/EmailLineChart';
import EmailMarketing from './components/EmailMarketing';
import EmailPerformance from './components/EmailPerformance';
import PageMeta from '@/components/PageMeta';
import { DashboardHero, DashboardSectionHeading } from '@/components/dashboard/DashboardChrome';
import { Link } from 'react-router';
import { LuArrowRight, LuBadgeCheck, LuCalendarRange, LuMail, LuSparkles, LuTarget } from 'react-icons/lu';

const metricCards = [
  {
    label: 'Campaign health',
    value: '92.7%',
    detail: 'Open rate is holding above target this month.',
    icon: LuBadgeCheck,
    tint: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20'
  },
  {
    label: 'Active sends',
    value: '1,452',
    detail: 'Automated and scheduled sends across live segments.',
    icon: LuMail,
    tint: 'from-sky-500/20 to-sky-500/5 border-sky-500/20'
  },
  {
    label: 'Conversion focus',
    value: '4.06%',
    detail: 'Click-through is strongest in onboarding sequences.',
    icon: LuTarget,
    tint: 'from-amber-500/20 to-amber-500/5 border-amber-500/20'
  }
];

const Index = () => {
  return <>
      <PageMeta title="Email" />
      <main>
        <PageBreadcrumb title="Email Analytics" subtitle="Dashboard" />

        <DashboardHero eyebrow={<><LuSparkles className="size-3.5" /> Revenue-facing inbox intelligence</>} title="Build cleaner campaigns and faster follow-ups." description="This dashboard now prioritizes delivery confidence, response momentum, and the next actions your team should take instead of stacking charts without context." primaryAction={<Link to="/mailbox" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-sky-950 transition hover:bg-sky-50">
              Open Mailbox
              <LuArrowRight className="size-4" />
            </Link>} secondaryAction={<button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15">
              <LuCalendarRange className="size-4" />
              Review campaign trends
            </button>} highlights={metricCards} summaryTitle="Calendar pressure points" />

        <DashboardSectionHeading eyebrow="Pulse" title="Campaign momentum" description="Read the trendline and operator notes together before drilling into supporting charts." badge="This month" />
        <section className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <EmailLineChart />
          </div>
          <div className="xl:col-span-4 rounded-3xl border border-default-200 bg-default-50/60 p-5 dark:bg-default-100/5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-default-500">Focus summary</p>
                <h3 className="mt-2 text-xl font-semibold text-default-900">What deserves attention next</h3>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">This month</span>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-default-200 bg-white p-4 dark:bg-default-50/5">
                <p className="text-sm font-semibold text-default-900">Open rates are healthy</p>
                <p className="mt-1 text-sm leading-6 text-default-500">Keep subject-line testing focused on conversion quality rather than volume. The current open-rate ceiling is strong enough.</p>
              </div>
              <div className="rounded-2xl border border-default-200 bg-white p-4 dark:bg-default-50/5">
                <p className="text-sm font-semibold text-default-900">Click-through still has room</p>
                <p className="mt-1 text-sm leading-6 text-default-500">The biggest lift opportunity is clearer CTA sequencing in onboarding and product education emails.</p>
              </div>
              <div className="rounded-2xl border border-default-200 bg-white p-4 dark:bg-default-50/5">
                <p className="text-sm font-semibold text-default-900">Holiday timing matters</p>
                <p className="mt-1 text-sm leading-6 text-default-500">Use the synced calendar panel to avoid sending important campaigns into low-response windows.</p>
              </div>
            </div>
          </div>
        </section>

        <DashboardSectionHeading eyebrow="Quality" title="Rate and risk signals" description="These cards condense the health of delivery, bounce, unsubscribe, and spam pressure into one row." />
        <EmailBarChart />

        <DashboardSectionHeading eyebrow="Workflow" title="Channel tools and campaign depth" description="Use the deeper charting and action cards after the top-level picture is clear." />
        <section className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <EmailData />
          </div>
          <div className="xl:col-span-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-1">
            <EmailMarketing />
            <ComposeEmail />
          </div>
        </section>

        <DashboardSectionHeading eyebrow="Deep dive" title="Campaign performance table" description="Review segment-level outcomes once the headline trends identify which campaigns need intervention." />

        <EmailPerformance />
      </main>
    </>;
};
export default Index;