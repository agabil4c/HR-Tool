import { hrApi } from './hrApi';

let cachedRoles = null;
let rolesLoading = false;
let rolesLoadPromise = null;

const CACHE_KEY = '__HR_TOOL_ROLES_CACHE__';
const CACHE_EXPIRY_KEY = '__HR_TOOL_ROLES_CACHE_EXPIRY__';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const getCachedRoles = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);

    if (cached && expiry && Date.now() < parseInt(expiry, 10)) {
      return JSON.parse(cached);
    }

    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  } catch {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  }

  return null;
};

const setCachedRoles = (roles) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(roles));
    localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_EXPIRY_MS));
  } catch {
    // Silently fail if localStorage is full
  }
};

export const loadRoles = async (forceRefresh = false) => {
  if (!forceRefresh && cachedRoles) {
    return cachedRoles;
  }

  if (typeof window === 'undefined') {
    return [];
  }

  // Prevent calling backend if user is not authenticated (requires auth token)
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return [];
  }

  if (forceRefresh !== true && rolesLoadPromise) {
    return rolesLoadPromise;
  }

  if (!forceRefresh) {
    const saved = getCachedRoles();
    if (saved && Array.isArray(saved) && saved.length > 0) {
      cachedRoles = saved;
      return saved;
    }
  }

  rolesLoading = true;
  rolesLoadPromise = (async () => {
    try {
      const roles = await hrApi.getRoleAccessProfiles();
      if (Array.isArray(roles) && roles.length > 0) {
        cachedRoles = roles;
        setCachedRoles(roles);
      }
      return cachedRoles || [];
    } catch (error) {
      console.error('Failed to load roles', error);
      return cachedRoles || [];
    } finally {
      rolesLoading = false;
      rolesLoadPromise = null;
    }
  })();

  return rolesLoadPromise;
};

export const getRoleByAccessLevel = (accessLevel) => {
  if (!cachedRoles || !Array.isArray(cachedRoles)) {
    return null;
  }

  const normalized = (accessLevel || '').toLowerCase().trim();
  return cachedRoles.find(role => (role.accessLevel || '').toLowerCase().trim() === normalized);
};

export const getPermissionsForAccessLevel = (accessLevel) => {
  const role = getRoleByAccessLevel(accessLevel);
  return role?.permissions || [];
};

export const getDashboardRouteForAccessLevel = (accessLevel) => {
  const role = getRoleByAccessLevel(accessLevel);
  return role?.dashboardRoute || '/dashboard';
};

export const clearRolesCache = () => {
  cachedRoles = null;
  rolesLoadPromise = null;
  rolesLoading = false;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  }
};
