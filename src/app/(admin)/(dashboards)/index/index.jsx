import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import Audience from './components/Audience';
import CustomerService from './components/CustomerService';
import OrderStatistics from './components/OrderStatistics';
import ProductOrderDetails from './components/ProductOrderDetails';
import ProductOrders from './components/ProductOrders';
import SalesRevenueOverview from './components/SalesRevenueOverview';
import SalesThisMonth from './components/SalesThisMonth';
import TopSellingProducts from './components/TopSellingProducts';
import TrafficResources from './components/TrafficResources';
import WelcomeUser from './components/WelcomeUser';
import { DashboardHero, DashboardSectionHeading } from '@/components/dashboard/DashboardChrome';
import { Link } from 'react-router';
import { LuArrowRight, LuBoxes, LuChartColumn, LuShoppingBag, LuSparkles } from 'react-icons/lu';

const metricCards = [
  {
    label: 'Gross momentum',
    value: '$128K',
    detail: 'Revenue acceleration is strongest in repeat-purchase categories.',
    icon: LuChartColumn,
    tint: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20'
  },
  {
    label: 'Orders today',
    value: '864',
    detail: 'Order flow remains stable through peak browsing hours.',
    icon: LuShoppingBag,
    tint: 'from-sky-500/20 to-sky-500/5 border-sky-500/20'
  },
  {
    label: 'Inventory watch',
    value: '24 SKUs',
    detail: 'Low-stock items are concentrated in top-selling bundles.',
    icon: LuBoxes,
    tint: 'from-amber-500/20 to-amber-500/5 border-amber-500/20'
  }
];
const Index = () => {
  return <>
      <PageMeta title="Ecommerce" />
      <main>
        <PageBreadcrumb title="Ecommerce" subtitle="Dashboards" />

        <DashboardHero eyebrow={<><LuSparkles className="size-3.5" /> Commerce command center</>} title="See demand shifts before they become operational problems." description="The ecommerce dashboard now opens with revenue posture, inventory pressure, and the business signals worth acting on first instead of forcing you to scan every widget equally." primaryAction={<Link to="#" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-sky-950 transition hover:bg-sky-50">
              Open order pipeline
              <LuArrowRight className="size-4" />
            </Link>} secondaryAction={<button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15">
              Review revenue mix
            </button>} highlights={metricCards} summaryTitle="Commercial calendar" />

        <div className="grid lg:grid-cols-3 grid-cols-1 gap-5 mb-5">
          <div className="lg:col-span-2 col-span-1">
            <WelcomeUser />
            <ProductOrderDetails />
          </div>
          <OrderStatistics />
        </div>

        <DashboardSectionHeading eyebrow="Performance" title="Revenue and traffic overview" description="Track top-line growth and acquisition quality together so channel spikes have business context." badge="Live" />
        <div className="grid lg:grid-cols-3 grid-cols-1 gap-5 mb-5">
          <SalesRevenueOverview />
          <TrafficResources />
        </div>

        <DashboardSectionHeading eyebrow="Operations" title="Order execution details" description="Use the order table to validate whether commercial gains are turning into healthy fulfillment volume." />
        <ProductOrders />

        <DashboardSectionHeading eyebrow="Signals" title="Supporting metrics" description="Customer service pressure, product movement, and audience shifts all sit here as second-order indicators." />
        <div className="grid lg:grid-cols-4 grid-cols-1 gap-5">
          <CustomerService />
          <SalesThisMonth />
          <TopSellingProducts />
          <Audience />
        </div>
      </main>
    </>;
};
export default Index;