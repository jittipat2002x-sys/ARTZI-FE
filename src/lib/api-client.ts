const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100/api';

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
    body?: unknown;
}

interface ApiResponse<T = unknown> {
    data: T;
    message?: string;
    statusCode?: number;
}

async function request<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
    const { body, headers: customHeaders, ...restOptions } = options;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...customHeaders,
    };

    // Auto-attach token
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...restOptions,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    // Handle 401 Unauthorized — clear token and redirect (only if not already on login page)
    if (response.status === 401) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        const errorData = await response.json().catch(() => null);
        throw { message: errorData?.message || 'Unauthorized: Invalid credentials', status: 401 };
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw { message: errorData?.message || `Request failed with status ${response.status}`, status: response.status };
    }

    return response.json();
}

/**
 * Drop-in replacement for native fetch — auto-attaches Bearer token
 * and prepends API_BASE_URL.
 *
 * Usage:
 *   const res = await fetchWithAuth('/users');
 *   const res = await fetchWithAuth('/users', { method: 'POST', body: JSON.stringify(data) });
 */
export async function fetchWithAuth(
    endpoint: string,
    options: RequestInit = {},
): Promise<Response> {
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Handle 401 — clear token and redirect (only if not already on login page)
    if (response.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    return response;
}

export const apiClient = {
    get: <T = unknown>(endpoint: string, options?: ApiRequestOptions) =>
        request<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = unknown>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
        request<T>(endpoint, { ...options, method: 'POST', body }),

    put: <T = unknown>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
        request<T>(endpoint, { ...options, method: 'PUT', body }),

    patch: <T = unknown>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
        request<T>(endpoint, { ...options, method: 'PATCH', body }),

    delete: <T = unknown>(endpoint: string, options?: ApiRequestOptions) =>
        request<T>(endpoint, { ...options, method: 'DELETE' }),
};
