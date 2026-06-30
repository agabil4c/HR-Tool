import { toast } from '@/components/Toast';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

const buildUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const buildHeaders = () => {
  const token = localStorage.getItem('auth_token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const buildApiError = async (response, method, path) => {
  let detail = `${method} ${path} failed with status ${response.status}`;

  try {
    const payload = await response.json();
    if (payload?.detail) {
      detail = String(payload.detail);
    }
  } catch {
    // Keep default detail when response has no JSON body.
  }

  // Global error notification handles
  if (response.status === 401 && !path.includes('/auth/login')) {
    toast.error("Session expired or unauthorized. Please log in again.");
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_session');
    // Re-route to login
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
  } else if (response.status >= 500) {
    toast.error("Server error: A server-side issue occurred. Please try again later.");
  }

  const error = new Error(detail);
  error.status = response.status;
  error.detail = detail;
  error.response = {
    status: response.status,
    data: {
      detail: detail
    }
  };
  return error;
};

async function apiCall(path, method, body = null, isForm = false) {
  const url = buildUrl(path);
  const token = localStorage.getItem('auth_token');

  const headers = isForm ? {
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  } : buildHeaders();

  const config = {
    method,
    headers,
    ...(body ? { body: isForm ? body : JSON.stringify(body) } : {})
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw await buildApiError(response, method, path);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      toast.error("Network connection error. Please check your internet connection.");
    }
    throw error;
  }
}

export async function apiGet(path) {
  return apiCall(path, 'GET');
}

export async function apiPost(path, body) {
  return apiCall(path, 'POST', body);
}

export async function apiPostForm(path, formData) {
  return apiCall(path, 'POST', formData, true);
}

export async function apiPut(path, body) {
  return apiCall(path, 'PUT', body);
}

export async function apiDelete(path) {
  return apiCall(path, 'DELETE');
}
