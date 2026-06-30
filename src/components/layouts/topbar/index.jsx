import ArabianFlag from '@/assets/images/flags/arebian.svg';
import FrenchFlag from '@/assets/images/flags/french.jpg';
import GermanyFlag from '@/assets/images/flags/germany.jpg';
import ItalyFlag from '@/assets/images/flags/italy.jpg';
import JapaneseFlag from '@/assets/images/flags/japanese.svg';
import RussiaFlag from '@/assets/images/flags/russia.jpg';
import SpainFlag from '@/assets/images/flags/spain.jpg';
import UsFlag from '@/assets/images/flags/us.jpg';
import avatar1 from '@/assets/images/user/avatar-1.png';
import avatar3 from '@/assets/images/user/avatar-3.png';
import avatar5 from '@/assets/images/user/avatar-5.png';
import avatar7 from '@/assets/images/user/avatar-7.png';
import { Link } from 'react-router';
import { TbSearch } from 'react-icons/tb';
import SimpleBar from 'simplebar-react';
import SidenavToggle from './SidenavToggle';
import ThemeModeToggle from './ThemeModeToggle';
import { LuBellRing, LuClock, LuHeart, LuLogOut, LuMoveRight, LuSettings, LuShoppingBag, LuUser } from 'react-icons/lu';
import { getAuthSession } from '@/utils/auth';
import { useState, useEffect } from 'react';
import { apiGet, apiPut } from '@/services/apiClient';

const languages = [{
  src: UsFlag,
  label: 'English'
}, {
  src: FrenchFlag,
  label: 'French'
}];

const tabs = [{
  id: 'tabsViewall',
  title: 'View all'
}, {
  id: 'tabsLeave',
  title: 'Leave'
}, {
  id: 'tabsPerformance',
  title: 'Performance'
}, {
  id: 'tabsProfile',
  title: 'Profile'
}];

const profileMenu = [{
  icon: <LuUser className="size-4" />,
  label: 'My Profile',
  to: '/dashboard'
}, {
  divider: true
}, {
  icon: <LuLogOut className="size-4" />,
  label: 'Sign Out',
  to: '/basic-logout'
}];

const Topbar = () => {
  const session = getAuthSession();
  const [notificationsList, setNotificationsList] = useState([]);
  const [activeTab, setActiveTab] = useState('tabsViewall');

  const fetchNotifications = async () => {
    try {
      const data = await apiGet('/v1/notifications');
      setNotificationsList(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notificationsList.filter(n => !n.isRead).length;

  const handleMarkRead = async (id) => {
    try {
      await apiPut(`/v1/notifications/${id}/read`);
      setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiPut('/v1/notifications/read-all');
      setNotificationsList(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return { time: '', ago: '' };
    const cleanStr = dateStr.includes(' ') && !dateStr.includes('T') ? dateStr.replace(' ', 'T') : dateStr;
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) {
      return { time: dateStr, ago: '' };
    }
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    let ago = 'just now';
    if (diffDays > 0) {
      ago = `${diffDays}d ago`;
    } else if (diffHr > 0) {
      ago = `${diffHr}h ago`;
    } else if (diffMin > 0) {
      ago = `${diffMin}m ago`;
    } else if (diffSec > 10) {
      ago = `${diffSec}s ago`;
    }

    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    const time = date.toLocaleTimeString(undefined, options);
    return { time, ago };
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave':
        return <LuClock className="size-5 text-primary" />;
      case 'performance':
        return <LuHeart className="size-5 text-danger" />;
      case 'profile':
        return <LuUser className="size-5 text-success" />;
      default:
        return <LuBellRing className="size-5 text-warning" />;
    }
  };

  const groupedNotifications = {
    tabsViewall: notificationsList,
    tabsLeave: notificationsList.filter(n => n.type === 'leave'),
    tabsPerformance: notificationsList.filter(n => n.type === 'performance'),
    tabsProfile: notificationsList.filter(n => n.type === 'profile')
  };

  return <div className="app-header min-h-topbar-height flex items-center sticky top-0 z-30 bg-(--topbar-background) border-b border-default-200 dark">
      <div className="w-full flex items-center justify-between px-6">
        <div className="flex items-center gap-5">
          <SidenavToggle />
        </div>

        <div className="flex items-center gap-3">
          <div className="topbar-item hs-dropdown [--placement:bottom-right] relative inline-flex">
            <button className="hs-dropdown-toggle btn btn-icon size-8 hover:bg-default-150 rounded-full relative" type="button">
              <img src={UsFlag} alt="us-flag" className="size-4.5 rounded" />
            </button>
            <div className="hs-dropdown-menu" role="menu">
              {languages.map((lang, i) => <Link key={i} to="#" className="flex items-center gap-x-3.5 py-1.5 px-3 text-default-600 hover:bg-default-150 rounded font-medium">
                  <img src={lang.src} alt={lang.label} className="size-4 rounded-full" />
                  {lang.label}
                </Link>)}
            </div>
          </div>

          <div className="topbar-item hs-dropdown [--auto-close:inside] relative inline-flex">
            <button type="button" className="hs-dropdown-toggle btn btn-icon size-8 hover:bg-default-150 rounded-full relative">
              <LuBellRing className="size-4.5" />
              {unreadCount > 0 && (
                <span className="absolute end-0 top-0 size-1.5 bg-primary rounded-full animate-ping"></span>
              )}
              {unreadCount > 0 && (
                <span className="absolute end-0 top-0 size-1.5 bg-primary rounded-full"></span>
              )}
            </button>
            <div className="hs-dropdown-menu max-w-100 p-0">
              <div className="p-4 border-b border-default-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base text-default-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="size-5 font-semibold bg-orange-500 rounded text-white flex items-center justify-center text-xs">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline font-medium cursor-pointer">
                    Mark all read
                  </button>
                )}
              </div>

              <nav className="flex gap-x-1 bg-default-150 p-2 border-b border-default-200" role="tablist">
                {tabs.map((tab, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-1 px-3 rounded font-semibold text-xs whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-default-500 hover:text-blue-600'
                    }`}
                  >
                    {tab.title}
                  </button>
                ))}
              </nav>

              <SimpleBar className="h-80">
                {tabs.map((tab, i) => (
                  <div key={i} id={tab.id} className={activeTab === tab.id ? '' : 'hidden'}>
                    {groupedNotifications[tab.id]?.map((n, j) => {
                      const { time, ago } = formatTimeAgo(n.createdAt);
                      return (
                        <div
                          key={j}
                          onClick={() => handleMarkRead(n.id)}
                          className={`flex gap-3 p-4 items-start hover:bg-default-150 cursor-pointer border-b border-default-100 last:border-b-0 ${
                            !n.isRead ? 'bg-default-50/50' : ''
                          }`}
                        >
                          <div className="size-10 rounded-md bg-default-100 flex justify-center items-center shrink-0">
                            {getNotificationIcon(n.type)}
                          </div>
                          <div className="flex justify-between w-full text-sm">
                            <div className="pr-2">
                              <h6 className={`mb-1 text-default-800 ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>
                                {n.title}
                              </h6>
                              <p className="text-default-600 text-xs mb-1.5">{n.message}</p>
                              <p className="flex items-center gap-1 text-default-400 text-xs">
                                <LuClock className="size-3.5" /> <span>{time}</span>
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 text-xs text-default-500 shrink-0">
                              {!n.isRead && (
                                <span className="size-2 bg-primary rounded-full" title="Unread"></span>
                              )}
                              <span>{ago}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {groupedNotifications[tab.id]?.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 px-4 text-center h-full">
                        <LuBellRing className="size-8 text-default-300 mb-2" />
                        <p className="text-sm text-default-500 font-medium">No notifications in this category</p>
                      </div>
                    )}
                  </div>
                ))}
              </SimpleBar>

              <div className="flex items-center justify-between p-4 border-t border-default-200">
                <span className="text-sm font-medium text-default-900">
                  Manage notifications in-app
                </span>
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="btn btn-sm text-white bg-primary cursor-pointer"
                >
                  Clear All <LuMoveRight className="size-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="topbar-item hs-dropdown relative inline-flex">
            <button className="cursor-pointer bg-pink-100 rounded-full">
              <img src={avatar1} alt="user" className="hs-dropdown-toggle rounded-full size-9.5" />
            </button>
            <div className="hs-dropdown-menu min-w-48">
              <div className="p-2">
                <h6 className="mb-2 text-default-500">Logged into HR Portal</h6>
                <Link to="/dashboard" className="flex gap-3">
                  <div className="relative inline-block">
                    <img src={avatar1} alt="user" className="size-12 rounded" />
                    <span className="-top-1 -end-1 absolute w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h6 className="mb-1 text-sm font-semibold text-default-800">{session?.fullName || 'User'}</h6>
                    <p className="text-default-500">{session?.role || session?.accessLevel || ''}</p>
                  </div>
                </Link>
              </div>

              <div className="border-t border-default-200 -mx-2 my-2"></div>

              <div className="flex flex-col gap-y-1">
                {profileMenu.map((item, i) => item.divider ? <div key={i} className="border-t border-default-200 -mx-2 my-1"></div> : <Link key={i} to={item.to || '#!'} className="flex items-center gap-x-3.5 py-1.5 px-3 text-default-600 hover:bg-default-150 rounded font-medium">
                      {item.icon}
                      {item.label}
                      {item.badge && <span className="size-4.5 font-semibold bg-danger rounded text-white flex items-center justify-center text-xs">
                          {item.badge}
                        </span>}
                    </Link>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};

export default Topbar;