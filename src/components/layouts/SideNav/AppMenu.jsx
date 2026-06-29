import { Link, useLocation } from 'react-router-dom';
import { LuChevronRight } from 'react-icons/lu';
import { menuItemsData } from './menu';
import { getAuthSession, hasSectionAccess } from '@/utils/auth';
const isItemActive = (item, pathname) => {
  if (item.href && pathname === item.href) return true;
  if (item.children) {
    return item.children.some(child => isItemActive(child, pathname));
  }
  return false;
};
const hasAccessLevelAccess = (item, accessLevel) => {
  if (!item.accessLevels) return true;
  return item.accessLevels.includes(accessLevel);
};
const hasPermissionForItem = (item, session) => {
  return hasSectionAccess(session, item.permissionKey);
};

const MENU_ACCESS_LEVEL_ALIASES = {
  'line-manager': 'department-manager',
  'dept-head': 'department-manager',
  'department-head': 'department-manager',
  'general-manager': 'department-manager',
  'self-service': 'employee'
};

const normalizeAccessLevelForMenu = (value) => {
  const normalized = (value || '').toLowerCase().trim().replace(/[_\s]+/g, '-');
  return MENU_ACCESS_LEVEL_ALIASES[normalized] || normalized;
};

const filterMenuByAccessLevel = (items, accessLevel, session) => {
  const filtered = items.map(item => {
    if (item.isTitle) return item;
    if (!hasAccessLevelAccess(item, accessLevel)) return null;
    if (!hasPermissionForItem(item, session)) return null;

    const normalizedItem = item.key === 'Dashboard' ? {
      ...item,
      href: session.dashboardRoute || item.href
    } : item;

    if (item.children) {
      const childItems = filterMenuByAccessLevel(item.children, accessLevel, session).filter(child => !child.isTitle);
      if (childItems.length === 0) return null;
      return {
        ...normalizedItem,
        children: childItems
      };
    }
    return normalizedItem;
  }).filter(Boolean);
  return filtered.filter((item, index) => {
    if (!item.isTitle) return true;
    return filtered.slice(index + 1).some(nextItem => !nextItem.isTitle);
  });
};
const MenuItemWithChildren = ({
  item
}) => {
  const {
    pathname
  } = useLocation();
  const Icon = item.icon;
  const isActive = isItemActive(item, pathname);
  return <li className={`menu-item hs-accordion ${isActive ? 'active' : ''}`}>
      <button className={`hs-accordion-toggle menu-link ${isActive ? 'active' : ''}`}>
        {Icon && <span className="menu-icon">
            <Icon />
          </span>}
        <span className="menu-text">{item.label}</span>
        <span className="menu-arrow">
          <LuChevronRight />
        </span>
      </button>

      <ul className={`sub-menu hs-accordion-content hs-accordion-group ${isActive ? 'block' : 'hidden'}`}>
        {item.children?.map(child => child.children ? <MenuItemWithChildren key={child.key} item={child} /> : <MenuItem key={child.key} item={child} />)}
      </ul>
    </li>;
};
const MenuItem = ({
  item
}) => {
  const {
    pathname
  } = useLocation();
  const Icon = item.icon;
  const isActive = pathname === item.href;
  return <li className={`menu-item ${isActive ? 'active' : ''}`}>
      <Link to={item.href ?? '#'} className={`menu-link ${isActive ? 'active' : ''}`}>
        {Icon && <span className="menu-icon">
            <Icon />
          </span>}
        <div className="menu-text">{item.label}</div>
      </Link>
    </li>;
};
const AppMenu = () => {
  const session = getAuthSession();
  const effectiveAccessLevel = normalizeAccessLevelForMenu(
    session?.accessLevel && session.accessLevel !== 'employee' ? session.accessLevel : session?.role || 'employee'
  );
  const visibleMenuItems = filterMenuByAccessLevel(menuItemsData, effectiveAccessLevel, session);
  return <ul className="side-nav p-3 hs-accordion-group">
      {visibleMenuItems.map(item => item.isTitle ? <li className="menu-title" key={item.key}>
            <span>{item.label}</span>
          </li> : item.children ? <MenuItemWithChildren key={item.key} item={item} /> : <MenuItem key={item.key} item={item} />)}
    </ul>;
};
export default AppMenu;