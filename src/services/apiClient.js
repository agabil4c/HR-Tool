const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

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

  const error = new Error(detail);
  error.status = response.status;
  error.detail = detail;
  return error;
};

export async function apiGet(path) {
  const response = await fetch(buildUrl(path), {
    method: 'GET',
    headers: buildHeaders()
  });

  if (!response.ok) {
    throw await buildApiError(response, 'GET', path);
  }

  return response.json();
}

export async function apiPost(path, body) {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw await buildApiError(response, 'POST', path);
  }

  return response.json();
}

export async function apiPostForm(path, formData) {
  const token = localStorage.getItem('auth_token');

  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  if (!response.ok) {
    throw await buildApiError(response, 'POST', path);
  }

  return response.json();
}

export async function apiPut(path, body) {
  const response = await fetch(buildUrl(path), {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw await buildApiError(response, 'PUT', path);
  }

  return response.json();
}

export async function apiDelete(path) {
  const response = await fetch(buildUrl(path), {
    method: 'DELETE',
    headers: buildHeaders()
  });

  if (!response.ok) {
    throw await buildApiError(response, 'DELETE', path);
  }

  return response.json();
}
