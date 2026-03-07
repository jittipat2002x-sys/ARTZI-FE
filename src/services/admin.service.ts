import { authService } from './auth.service';

const API_BASE = 'http://localhost:3100/api';

function getHeaders() {
    const token = authService.getToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

async function handleResponse(res: Response) {
    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || 'Request failed');
    }
    const json = await res.json();
    // Return whole object if meta is present, otherwise return data
    if (json.data !== undefined && json.meta !== undefined) return json;
    return json.data !== undefined ? json.data : json;
}

// ===== Users =====
export const userManagementService = {
    async getAll(page: number = 1, limit: number = 10, search?: string, branchId?: string, tenantId?: string) {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (branchId) params.append('branchId', branchId);
        if (tenantId) params.append('tenantId', tenantId);
        const res = await fetch(`${API_BASE}/users?${params.toString()}`, { headers: getHeaders() });
        return handleResponse(res);
    },
    async getById(id: string) {
        const res = await fetch(`${API_BASE}/users/${id}`, { headers: getHeaders() });
        return handleResponse(res);
    },
    async create(data: { email: string; password: string; firstName: string; lastName: string; roleId?: string }) {
        const res = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    async update(id: string, data: any) {
        const res = await fetch(`${API_BASE}/users/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    async delete(id: string) {
        const res = await fetch(`${API_BASE}/users/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },
};

// ===== Roles =====
export const roleService = {
    async getAll(page: number = 1, limit: number = 10) {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        const res = await fetch(`${API_BASE}/roles?${params.toString()}`, { headers: getHeaders() });
        return handleResponse(res);
    },
    async getById(id: string) {
        const res = await fetch(`${API_BASE}/roles/${id}`, { headers: getHeaders() });
        return handleResponse(res);
    },
    async create(data: { name: string; description?: string }) {
        const res = await fetch(`${API_BASE}/roles`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    async update(id: string, data: any) {
        const res = await fetch(`${API_BASE}/roles/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    async delete(id: string) {
        const res = await fetch(`${API_BASE}/roles/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },
    async assignMenus(roleId: string, menuIds: string[]) {
        const res = await fetch(`${API_BASE}/roles/${roleId}/menus`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ menuIds }),
        });
        return handleResponse(res);
    },
    async getMenus(roleId: string) {
        const res = await fetch(`${API_BASE}/roles/${roleId}/menus`, { headers: getHeaders() });
        return handleResponse(res);
    },
};

// ===== Menus =====
export const menuService = {
    async getAll() {
        const res = await fetch(`${API_BASE}/menus`, { headers: getHeaders() });
        return handleResponse(res);
    },
    async getAllFlat() {
        const res = await fetch(`${API_BASE}/menus/flat`, { headers: getHeaders() });
        return handleResponse(res);
    },
    async create(data: { name: string; path?: string; icon?: string; parentId?: string; sortOrder?: number }) {
        const res = await fetch(`${API_BASE}/menus`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    async update(id: string, data: any) {
        const res = await fetch(`${API_BASE}/menus/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    async delete(id: string) {
        const res = await fetch(`${API_BASE}/menus/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },
};

// ===== Tenants =====
export const tenantService = {
    async getAll(status?: string, page: number = 1, limit: number = 10, search?: string) {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        const res = await fetch(`${API_BASE}/tenants?${params.toString()}`, { headers: getHeaders() });
        return handleResponse(res);
    },
    async getById(id: string) {
        const res = await fetch(`${API_BASE}/tenants/${id}`, { headers: getHeaders() });
        return handleResponse(res);
    },
    async updateStatus(id: string, data: { status: string; reason?: string; activePlan?: string; planExpiresAt?: string }) {
        const res = await fetch(`${API_BASE}/tenants/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    async delete(id: string) {
        const res = await fetch(`${API_BASE}/tenants/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },
};

// ===== Branches =====
export const branchService = {
    async getAll(page: number = 1, limit: number = 10, search?: string) {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        const res = await fetch(`${API_BASE}/branches?${params.toString()}`, { headers: getHeaders() });
        return handleResponse(res);
    },
    async create(data: { name: string; address?: string; phone?: string }) {
        const res = await fetch(`${API_BASE}/branches`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    async update(id: string, data: any) {
        const res = await fetch(`${API_BASE}/branches/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    async delete(id: string) {
        const res = await fetch(`${API_BASE}/branches/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },
};

// ===== Branding =====
export const brandingService = {
    async get() {
        const res = await fetch(`${API_BASE}/tenants/my/branding`, { headers: getHeaders() });
        return handleResponse(res);
    },
    async update(data: { brandColor?: string; logoUrl?: string }) {
        const res = await fetch(`${API_BASE}/tenants/my/branding`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
};
