import PageBreadcrumb from '@/components/PageBreadcrumb';
import Analytics from './components/Analytics';
import AnalyticsReports from './components/AnalyticsReports';
import LocationBased from './components/LocationBased';
import PagesInteraction from './components/PagesInteraction';
import PerspectiveChart from './components/PerspectiveChart';
import ProductsStatistics from './components/ProductsStatistics';
import StatusOfMonthlyCampaign from './components/StatusOfMonthlyCampaign';
import SubscriptionDistribution from './components/SubscriptionDistribution';
import TrafficSource from './components/TrafficSource';
import UserChart from './components/UserChart';
import PageMeta from '@/components/PageMeta';
import { DashboardHero, DashboardSectionHeading } from '@/components/dashboard/DashboardChrome';
import { Link } from 'react-router';
import { LuActivity, LuArrowRight, LuRadar, LuSparkles, LuUsers } from 'react-icons/lu';

const metricCards = [
  {
    label: 'Audience growth',
    value: '+18.4%',
    detail: 'Returning-user volume is compounding faster than cold acquisition.',
    icon: LuUsers,
    tint: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20'
  },
  {
    label: 'Engagement lift',
    value: '31.2%',
    detail: 'Most gains are coming from deeper product-detail interactions.',
    icon: LuActivity,
    tint: 'from-sky-500/20 to-sky-500/5 border-sky-500/20'
  },
  {
    label: 'Source quality',
    value: '4.8/5',
    detail: 'Higher-intent sources are outperforming in both retention and conversion.',
    icon: LuRadar,
    tint: 'from-amber-500/20 to-amber-500/5 border-amber-500/20'
  }
];
const Index = () => {
  return <>
      <PageMeta title="Analytics" />
      <main>
        <PageBreadcrumb title="Analytics" subtitle="Dashboard" />

        <DashboardHero eyebrow={<><LuSparkles className="size-3.5" /> Behavioral intelligence</>} title="Turn site activity into decisions the team can defend." description="This analytics dashboard now surfaces the strongest audience, campaign, and traffic signals first so the supporting charts read like evidence rather than clutter." primaryAction={<Link to="#" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-sky-950 transition hover:bg-sky-50">
              Explore traffic sources
              <LuArrowRight className="size-4" />
            </Link>} secondaryAction={<button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15">
              Compare campaign windows
            </button>} highlights={metricCards} summaryTitle="Time-sensitive signals" />

        <DashboardSectionHeading eyebrow="Pulse" title="Core analytics picture" description="Start with the broad trendline and perspective view before drilling into channel-level patterns." badge="Updated hourly" />
        <div className="grid lg:grid-cols-3 grid-cols-1 gap-5 mb-5">
          <Analytics />
          <PerspectiveChart />
        </div>

        <DashboardSectionHeading eyebrow="Context" title="Interaction and location" description="These views explain where the strongest audiences are coming from and how deeply they engage." />
        <div className="grid lg:grid-cols-12 grid-cols-1 gap-5 mb-5">
          <LocationBased />
          <PagesInteraction />
        </div>

        <DashboardSectionHeading eyebrow="Users" title="Audience trajectory" description="Use the user trend and product statistics together to separate curiosity from conversion intent." />
        <UserChart />
        <ProductsStatistics />

        <DashboardSectionHeading eyebrow="Breakdown" title="Secondary analytic modules" description="Campaign status, subscription distribution, and traffic sources complete the decision layer." />
        <div className="grid lg:grid-cols-4 grid-cols-1 gap-5">
          <AnalyticsReports />
          <StatusOfMonthlyCampaign />
          <SubscriptionDistribution />
          <TrafficSource />
        </div>
      </main>
    </>;
};
export default Index;