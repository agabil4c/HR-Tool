import Footer from '@/components/layouts/Footer';
import Sidebar from '@/components/layouts/SideNav';
import Topbar from '@/components/layouts/topbar';
const PageWrapper = ({
  children
}) => {
  return <>
      <div className="wrapper">
        <Sidebar />
        <div className="page-content">
          <Topbar />
          {children}
          <Footer />
        </div>
      </div>
    </>;
};
export default PageWrapper;