import { Link } from 'react-router';
import SimplebarClient from '@/components/client-wrapper/SimplebarClient';
import AppMenu from './AppMenu';
import HoverToggle from './HoverToggle';
import logoDark from '@/assets/images/logo-dark.png';
import logoLight from '@/assets/images/logo-light.png';
import TpLogoDark from '@/assets/images/TRAVELPORT_LOGO_BLACK_CMYK.png';
import TpLogoLight from '@/assets/images/TRAVELPORT_LOGO_SAND_CMYK.png';
import TpLogoDarkSm from '@/assets/images/TRAVELPORT_SYMBOL_RGB_BLACK.png';
import TpLogoLightSm from '@/assets/images/TRAVELPORT_SYMBOL_RGB_SAND.png';
import logoSm from '@/assets/images/logo-sm.png';
const Sidebar = () => {
  return <aside id="app-menu" className="app-menu dark">
      <Link to="/index" className="logo-box sticky top-0 flex min-h-topbar-height items-center justify-start px-6 backdrop-blur-xs">
        <div className="logo-light">
          <img src={TpLogoLight} className="logo-lg" alt="Light logo" />
          <img src={TpLogoLightSm} className="logo-sm" alt="Small logo" />
        </div>

        <div className="logo-dark">
          <img src={TpLogoDark} className="logo-lg" alt="Dark logo"/>
          <img src={TpLogoDarkSm} className="logo-sm" alt="Small logo" />
        </div>
      </Link>

      <HoverToggle />

      <div className="relative min-h-0 flex-grow">
        <SimplebarClient className="size-full">
          <AppMenu />
        </SimplebarClient>
      </div>
    </aside>;
};
export default Sidebar;