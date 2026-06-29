import { Navigate, Route, Routes } from 'react-router-dom';
import { layoutsRoutes, singlePageRoutes } from './Routes';
import PageWrapper from '@/components/PageWrapper';
import { getAuthSession, hasRouteAccess } from '@/utils/auth';

const ProtectedLayoutRoute = ({ element, routePath }) => {
  const session = getAuthSession();

  if (!session.token) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRouteAccess(session, routePath)) {
    const fallbackRoute = session.dashboardRoute && session.dashboardRoute !== routePath ? session.dashboardRoute : '/login';
    return <Navigate to={fallbackRoute} replace />;
  }

  return <PageWrapper>{element}</PageWrapper>;
};

const RootRedirect = () => {
  const session = getAuthSession();
  return <Navigate to={session.token ? session.dashboardRoute : '/login'} replace />;
};

const AppRoutes = () => {
  return <>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        {layoutsRoutes.map(route => {
          const RouteComponent = route.component;
          return (
            <Route
              key={route.name}
              path={route.path}
              element={<ProtectedLayoutRoute routePath={route.path} element={<RouteComponent />} />}
            />
          );
        })}

        {singlePageRoutes.map(route => {
          const RouteComponent = route.component;
          return <Route key={route.name} path={route.path} element={<RouteComponent />} />;
        })}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>;
};
export default AppRoutes;